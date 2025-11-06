import React, { useState, useEffect } from "react";
import { Card, Row, Col, Statistic, Tag, Space, Pagination, Select, Spin, Typography, Alert, Radio, Divider } from "antd";
import { GlobalOutlined, CalendarOutlined, FileTextOutlined, WarningOutlined, FireOutlined, EyeOutlined } from "@ant-design/icons";
import type { PublicReport } from "../../types/simplified-schema";

const { Title, Text } = Typography;
const { Option } = Select;

interface DashboardStats {
  totalReports: number;
  totalReportCount: number;
  activeContent: number;
  deletedContent: number;
}

export const PublicDashboard: React.FC = () => {
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    totalReportCount: 0,
    activeContent: 0,
    deletedContent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    platform: undefined as string | undefined,
    country: undefined as string | undefined,
    language: undefined as string | undefined,
    activity_status: 'active' as 'active' | 'deleted' | 'all',
  });
  const [sortBy, setSortBy] = useState<'created_at' | 'report_count'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const authToken = localStorage.getItem('sb-access-token') || '';

      // Fetch all approved reports to calculate stats
      const response = await fetch(`${supabaseUrl}/rest/v1/reports?status=eq.approved&select=id,report_count,activity_status`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const totalReportCount = data.reduce((sum: number, r: any) => sum + r.report_count, 0);
        const activeCount = data.filter((r: any) => r.activity_status === 'active').length;
        const deletedCount = data.filter((r: any) => r.activity_status === 'deleted').length;

        setStats({
          totalReports: data.length,
          totalReportCount,
          activeContent: activeCount,
          deletedContent: deletedCount,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch reports from Edge Function
  const fetchReports = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      // Only add activity_status filter if not 'all'
      if (filters.activity_status !== 'all') {
        params.append('activity_status', filters.activity_status);
      }

      if (filters.platform) params.append('platform', filters.platform);
      if (filters.country) params.append('country', filters.country);
      if (filters.language) params.append('language', filters.language);

      const response = await fetch(`${supabaseUrl}/functions/v1/get-public-reports?${params}`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch reports');

      const data = await response.json();
      let fetchedReports = data.data || [];

      // Client-side sorting (since Edge Function doesn't support it yet)
      fetchedReports.sort((a: PublicReport, b: PublicReport) => {
        let aValue: any, bValue: any;

        if (sortBy === 'created_at') {
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
        } else { // report_count
          aValue = a.report_count;
          bValue = b.report_count;
        }

        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });

      setReports(fetchedReports);
      setTotal(data.pagination.total || 0);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [page, pageSize, filters, sortBy, sortOrder]);

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: 'blue',
      facebook: 'cyan',
      instagram: 'magenta',
      youtube: 'red',
      tiktok: 'purple',
      reddit: 'orange',
      other: 'default',
    };
    return colors[platform] || 'default';
  };

  const getActivityStatusColor = (status: string) => {
    return status === 'active' ? 'red' : 'green';
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters({ ...filters, [key]: value });
    setPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-');
    setSortBy(field as 'created_at' | 'report_count');
    setSortOrder(order as 'asc' | 'desc');
  };

  return (
    <div>
      {/* Header Section */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Public Dashboard</Title>
        <Text type="secondary">
          Tracking islamophobic content for transparency and action. All data is factual and GDPR-compliant.
        </Text>
      </div>

      {/* Statistics Summary */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Content Reports"
              value={stats.totalReports}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Unique pieces of content
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Report Count"
              value={stats.totalReportCount}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Total times content was reported
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Content"
              value={stats.activeContent}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Still online
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Deleted Content"
              value={stats.deletedContent}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Removed by platform
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Filters and Sorting */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text strong>Filters</Text>
            <Divider style={{ margin: '8px 0' }} />
            <Space wrap>
              <Select
                style={{ width: 150 }}
                placeholder="Platform"
                allowClear
                value={filters.platform}
                onChange={(value) => handleFilterChange('platform', value)}
              >
                <Option value="twitter">Twitter/X</Option>
                <Option value="facebook">Facebook</Option>
                <Option value="instagram">Instagram</Option>
                <Option value="youtube">YouTube</Option>
                <Option value="tiktok">TikTok</Option>
                <Option value="reddit">Reddit</Option>
                <Option value="other">Other</Option>
              </Select>

              <Select
                style={{ width: 150 }}
                placeholder="Language"
                allowClear
                value={filters.language}
                onChange={(value) => handleFilterChange('language', value)}
              >
                <Option value="en">English</Option>
                <Option value="ar">Arabic</Option>
                <Option value="fr">French</Option>
                <Option value="de">German</Option>
                <Option value="es">Spanish</Option>
                <Option value="ur">Urdu</Option>
                <Option value="tr">Turkish</Option>
                <Option value="hi">Hindi</Option>
              </Select>

              <Select
                style={{ width: 150 }}
                placeholder="Country"
                allowClear
                value={filters.country}
                onChange={(value) => handleFilterChange('country', value)}
              >
                <Option value="US">United States</Option>
                <Option value="GB">United Kingdom</Option>
                <Option value="FR">France</Option>
                <Option value="DE">Germany</Option>
                <Option value="IN">India</Option>
                <Option value="PK">Pakistan</Option>
                <Option value="SA">Saudi Arabia</Option>
                <Option value="AE">UAE</Option>
                <Option value="CA">Canada</Option>
                <Option value="AU">Australia</Option>
              </Select>

              <Radio.Group
                value={filters.activity_status}
                onChange={(e) => handleFilterChange('activity_status', e.target.value)}
              >
                <Radio.Button value="all">All Content</Radio.Button>
                <Radio.Button value="active">Active Only</Radio.Button>
                <Radio.Button value="deleted">Deleted Only</Radio.Button>
              </Radio.Group>
            </Space>
          </div>

          <div>
            <Text strong>Sort By</Text>
            <Divider style={{ margin: '8px 0' }} />
            <Select
              style={{ width: 200 }}
              value={`${sortBy}-${sortOrder}`}
              onChange={handleSortChange}
            >
              <Option value="created_at-desc">Newest First</Option>
              <Option value="created_at-asc">Oldest First</Option>
              <Option value="report_count-desc">Most Reported First</Option>
              <Option value="report_count-asc">Least Reported First</Option>
            </Select>
          </div>

          <div>
            <Text strong>Results Per Page</Text>
            <Divider style={{ margin: '8px 0' }} />
            <Radio.Group value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
              <Radio.Button value={20}>20</Radio.Button>
              <Radio.Button value={50}>50</Radio.Button>
              <Radio.Button value={100}>100</Radio.Button>
            </Radio.Group>
          </div>
        </Space>
      </Card>

      {/* GDPR Compliance Alert */}
      <Alert
        message="Privacy Notice"
        description="We display only factual information: Content ID, type, and platform. No personal data, usernames, or screenshots are shown. All data is GDPR-compliant."
        type="info"
        showIcon
        closable
        style={{ marginBottom: 24 }}
      />

      {/* Reports Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" tip="Loading reports..." />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Text type="secondary">No reports found with the current filters.</Text>
          </div>
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {reports.map((report) => (
              <Col xs={24} sm={12} md={8} lg={6} key={report.id}>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  bodyStyle={{ padding: 16 }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {/* Title - Content #123 – post on facebook */}
                    <Title level={5} style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
                      {report.title}
                    </Title>

                    {/* Platform Tag */}
                    <Tag color={getPlatformColor(report.platform)}>
                      {report.platform.toUpperCase()}
                    </Tag>

                    {/* Activity Status */}
                    <Tag color={getActivityStatusColor(report.activity_status)}>
                      {report.activity_status === 'active' ? 'STILL ACTIVE' : 'REMOVED'}
                    </Tag>

                    {/* Report Count */}
                    <Tag
                      color={
                        report.report_count > 100 ? 'red' :
                        report.report_count > 50 ? 'volcano' :
                        report.report_count > 10 ? 'orange' : 'default'
                      }
                      icon={report.report_count > 50 ? <FireOutlined /> : undefined}
                    >
                      {report.report_count} {report.report_count === 1 ? 'report' : 'reports'}
                    </Tag>

                    {/* Metadata */}
                    <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                      <Space direction="vertical" size={2}>
                        <div>
                          <GlobalOutlined /> {report.country} / {report.language}
                        </div>
                        <div>
                          <CalendarOutlined /> {new Date(report.created_at).toLocaleDateString()}
                        </div>
                      </Space>
                    </div>

                    {/* Link to Content (external) */}
                    <a
                      href={report.content_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, marginTop: 8, display: 'block' }}
                    >
                      View Original Content →
                    </a>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Pagination */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              onChange={(newPage) => setPage(newPage)}
              showSizeChanger={false}
              showTotal={(total) => `Total ${total} reports`}
            />
          </div>
        </>
      )}
    </div>
  );
};
