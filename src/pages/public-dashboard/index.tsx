import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Space,
  Pagination,
  Select,
  Spin,
  Typography,
  Radio,
  Divider,
  Button,
  Drawer,
  Collapse,
  Table,
  Badge,
  Empty,
  Skeleton,
  Tooltip,
  Descriptions,
} from "antd";
import type { ColumnsType } from 'antd/es/table';
import {
  GlobalOutlined,
  CalendarOutlined,
  FileTextOutlined,
  WarningOutlined,
  FireOutlined,
  EyeOutlined,
  FilterOutlined,
  LinkOutlined,
  InfoCircleOutlined,
  SafetyOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
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
  const [statsLoading, setStatsLoading] = useState(true);
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
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);

  // Fetch statistics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Fetch all approved reports to calculate stats (PUBLIC ACCESS - no auth needed)
      const response = await fetch(`${supabaseUrl}/rest/v1/reports?status=eq.approved&select=id,report_count,activity_status`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
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
    } finally {
      setStatsLoading(false);
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

  const clearAllFilters = () => {
    setFilters({
      platform: undefined,
      country: undefined,
      language: undefined,
      activity_status: 'active',
    });
    setPage(1);
  };

  // Count active filters
  const activeFilterCount = [
    filters.platform,
    filters.country,
    filters.language,
    filters.activity_status !== 'active' ? filters.activity_status : null,
  ].filter(Boolean).length;

  // Table columns
  const columns: ColumnsType<PublicReport> = [
    {
      title: 'Content',
      dataIndex: 'title',
      key: 'title',
      width: '30%',
      render: (title: string, record: PublicReport) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 14 }}>{title}</Text>
          <Space size={4}>
            <Tag color={getPlatformColor(record.platform)} style={{ fontSize: 11 }}>
              {record.platform.toUpperCase()}
            </Tag>
            <Tag color={getActivityStatusColor(record.activity_status)} style={{ fontSize: 11 }}>
              {record.activity_status === 'active' ? 'ACTIVE' : 'REMOVED'}
            </Tag>
          </Space>
        </Space>
      ),
    },
    {
      title: (
        <Space>
          <span>Reports</span>
          <Tooltip title="Number of times this content was reported">
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'report_count',
      key: 'report_count',
      width: '15%',
      sorter: true,
      render: (count: number) => (
        <Tag
          color={
            count > 100 ? 'red' :
            count > 50 ? 'volcano' :
            count > 10 ? 'orange' : 'default'
          }
          icon={count > 50 ? <FireOutlined /> : undefined}
          style={{ fontSize: 13, padding: '4px 8px' }}
        >
          {count} {count === 1 ? 'report' : 'reports'}
        </Tag>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      width: '20%',
      render: (_, record: PublicReport) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: 13 }}>
            <GlobalOutlined /> {record.country}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.language}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Reported Date',
      dataIndex: 'created_at',
      key: 'created_at',
      width: '15%',
      sorter: true,
      render: (date: string) => (
        <Space>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          <Text style={{ fontSize: 13 }}>{new Date(date).toLocaleDateString()}</Text>
        </Space>
      ),
    },
    {
      title: 'Link',
      key: 'link',
      width: '10%',
      render: (_, record: PublicReport) => (
        <a
          href={record.content_link}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button type="link" size="small" icon={<LinkOutlined />}>
            View
          </Button>
        </a>
      ),
    },
  ];

  // Expandable row render
  const expandedRowRender = (record: PublicReport) => (
    <Card size="small" style={{ background: '#fafafa', border: 'none' }}>
      <Descriptions column={2} size="small">
        <Descriptions.Item label="Content ID">
          <Text code>#{record.id}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Platform">
          <Tag color={getPlatformColor(record.platform)}>
            {record.platform.toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Activity Status">
          <Tag color={getActivityStatusColor(record.activity_status)}>
            {record.activity_status === 'active' ? 'STILL ACTIVE' : 'REMOVED BY PLATFORM'}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Report Count">
          <Badge count={record.report_count} style={{ backgroundColor: '#52c41a' }} />
        </Descriptions.Item>
        <Descriptions.Item label="Country">
          {record.country}
        </Descriptions.Item>
        <Descriptions.Item label="Language">
          {record.language}
        </Descriptions.Item>
        <Descriptions.Item label="First Reported">
          {new Date(record.created_at).toLocaleString()}
        </Descriptions.Item>
        <Descriptions.Item label="Content Link">
          <a href={record.content_link} target="_blank" rel="noopener noreferrer">
            {record.content_link.substring(0, 50)}...
          </a>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );

  return (
    <div>
      {/* Header Section */}
      <div style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={4}>
          <Title level={2} style={{ margin: 0 }}>Public Dashboard</Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Tracking islamophobic content for transparency and action. All data is factual and GDPR-compliant.
          </Text>
        </Space>
      </div>

      {/* Privacy Notice - Subtle Card instead of Alert */}
      <Card
        size="small"
        style={{
          background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
          border: '1px solid #d6e4ff',
          marginBottom: 24,
        }}
      >
        <Space align="start">
          <SafetyOutlined style={{ color: '#1890ff', fontSize: 20, marginTop: 2 }} />
          <div>
            <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
              Privacy & GDPR Compliant
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              We display only factual information: Content ID, type, and platform. No personal data, usernames, or screenshots are shown.
            </Text>
          </div>
        </Space>
      </Card>

      {/* Statistics Summary */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            {statsLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  title="Total Content Reports"
                  value={stats.totalReports}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Unique pieces of content
                </Text>
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            {statsLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  title="Total Report Count"
                  value={stats.totalReportCount}
                  prefix={<FireOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Total times content was reported
                </Text>
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            {statsLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  title="Active Content"
                  value={stats.activeContent}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Still online
                </Text>
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            {statsLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  title="Deleted Content"
                  value={stats.deletedContent}
                  prefix={<EyeOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Removed by platform
                </Text>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Filter Button and Active Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space wrap>
            <Button
              type="primary"
              icon={<FilterOutlined />}
              onClick={() => setFilterDrawerVisible(true)}
            >
              Filters {activeFilterCount > 0 && <Badge count={activeFilterCount} style={{ marginLeft: 8 }} />}
            </Button>

            {activeFilterCount > 0 && (
              <Button
                icon={<CloseCircleOutlined />}
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            )}

            {/* Active Filter Tags */}
            {filters.platform && (
              <Tag
                closable
                onClose={() => handleFilterChange('platform', undefined)}
                color="blue"
              >
                Platform: {filters.platform}
              </Tag>
            )}
            {filters.country && (
              <Tag
                closable
                onClose={() => handleFilterChange('country', undefined)}
                color="green"
              >
                Country: {filters.country}
              </Tag>
            )}
            {filters.language && (
              <Tag
                closable
                onClose={() => handleFilterChange('language', undefined)}
                color="orange"
              >
                Language: {filters.language}
              </Tag>
            )}
            {filters.activity_status !== 'active' && (
              <Tag
                closable
                onClose={() => handleFilterChange('activity_status', 'active')}
                color="purple"
              >
                Status: {filters.activity_status}
              </Tag>
            )}
          </Space>

          <Divider style={{ margin: '8px 0' }} />

          {/* Quick Controls */}
          <Space wrap>
            <Space>
              <Text strong style={{ fontSize: 13 }}>Sort:</Text>
              <Select
                style={{ width: 180 }}
                size="small"
                value={`${sortBy}-${sortOrder}`}
                onChange={handleSortChange}
              >
                <Option value="created_at-desc">Newest First</Option>
                <Option value="created_at-asc">Oldest First</Option>
                <Option value="report_count-desc">Most Reported</Option>
                <Option value="report_count-asc">Least Reported</Option>
              </Select>
            </Space>

            <Space>
              <Text strong style={{ fontSize: 13 }}>Per Page:</Text>
              <Radio.Group size="small" value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                <Radio.Button value={20}>20</Radio.Button>
                <Radio.Button value={50}>50</Radio.Button>
                <Radio.Button value={100}>100</Radio.Button>
              </Radio.Group>
            </Space>
          </Space>
        </Space>
      </Card>

      {/* Filter Drawer - Progressive Disclosure */}
      <Drawer
        title={
          <Space>
            <FilterOutlined />
            <span>Advanced Filters</span>
          </Space>
        }
        placement="right"
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        width={400}
      >
        <Collapse
          defaultActiveKey={['platform', 'status']}
          ghost
        >
          <Collapse.Panel
            header={
              <Space>
                <GlobalOutlined />
                <Text strong>Platform & Location</Text>
              </Space>
            }
            key="platform"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  Platform
                </Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select platform"
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
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  Country
                </Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select country"
                  allowClear
                  value={filters.country}
                  onChange={(value) => handleFilterChange('country', value)}
                  showSearch
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
              </div>

              <div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  Language
                </Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Select language"
                  allowClear
                  value={filters.language}
                  onChange={(value) => handleFilterChange('language', value)}
                  showSearch
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
              </div>
            </Space>
          </Collapse.Panel>

          <Collapse.Panel
            header={
              <Space>
                <WarningOutlined />
                <Text strong>Content Status</Text>
              </Space>
            }
            key="status"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                Activity Status
              </Text>
              <Radio.Group
                value={filters.activity_status}
                onChange={(e) => handleFilterChange('activity_status', e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Radio value="all">All Content</Radio>
                  <Radio value="active">Active Only (Still Online)</Radio>
                  <Radio value="deleted">Deleted Only (Removed)</Radio>
                </Space>
              </Radio.Group>
            </Space>
          </Collapse.Panel>
        </Collapse>

        <Divider />

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button onClick={clearAllFilters}>Clear All</Button>
          <Button type="primary" onClick={() => setFilterDrawerVisible(false)}>
            Apply Filters
          </Button>
        </Space>
      </Drawer>

      {/* Reports Table */}
      {loading ? (
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : reports.length === 0 ? (
        <Card>
          <Empty
            description={
              <Space direction="vertical">
                <Text type="secondary">No reports found with the current filters.</Text>
                <Button type="link" onClick={clearAllFilters}>
                  Clear filters and try again
                </Button>
              </Space>
            }
          />
        </Card>
      ) : (
        <>
          <Table
            columns={columns}
            dataSource={reports}
            rowKey="id"
            pagination={false}
            expandable={{
              expandedRowRender,
              expandRowByClick: false,
            }}
            scroll={{ x: 'max-content' }}
          />

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
