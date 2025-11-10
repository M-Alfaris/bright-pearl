import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Space,
  Button,
  Modal,
  Tag,
  message,
  Typography,
  Descriptions,
  Row,
  Col,
  Statistic,
  Tooltip,
  Skeleton,
  Empty,
  Divider,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  LinkOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { Report } from "../../types/simplified-schema";

const { Title, Text } = Typography;
const { confirm } = Modal;

interface ModeratorStats {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
}

export const ModeratorPendingList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState<ModeratorStats>({
    pendingCount: 0,
    approvedToday: 0,
    rejectedToday: 0,
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch moderator statistics
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const authToken = localStorage.getItem('sb-access-token');

      if (!authToken) return;

      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      // Fetch counts
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch(`${supabaseUrl}/rest/v1/reports?status=eq.pending&select=id`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${authToken}`,
          },
        }),
        fetch(`${supabaseUrl}/rest/v1/reports?status=eq.approved&updated_at=gte.${todayISO}&select=id`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${authToken}`,
          },
        }),
        fetch(`${supabaseUrl}/rest/v1/reports?status=eq.rejected&updated_at=gte.${todayISO}&select=id`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${authToken}`,
          },
        }),
      ]);

      const [pending, approved, rejected] = await Promise.all([
        pendingRes.json(),
        approvedRes.json(),
        rejectedRes.json(),
      ]);

      setStats({
        pendingCount: pending.length,
        approvedToday: approved.length,
        rejectedToday: rejected.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch pending reports from database
  const fetchReports = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const authToken = localStorage.getItem('sb-access-token');

      if (!authToken) {
        message.error('Please log in to access moderator functions');
        return;
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/reports?status=eq.pending&order=created_at.desc`, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch reports');

      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      message.error('Failed to fetch pending reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReports();
  }, []);

  const handleAction = async (reportId: number, action: 'approved' | 'rejected') => {
    setActionLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const authToken = localStorage.getItem('sb-access-token');

      const response = await fetch(`${supabaseUrl}/functions/v1/approve-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          report_id: reportId,
          action: action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        message.error(data.error || 'Failed to update report');
        return;
      }

      message.success(`Report #${reportId} has been ${action}`);
      setDetailsVisible(false);

      // Refresh data
      fetchStats();
      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      message.error('An error occurred while updating the report');
    } finally {
      setActionLoading(false);
    }
  };

  const showApproveConfirm = (report: Report) => {
    confirm({
      title: 'Approve Report',
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      content: (
        <Space direction="vertical">
          <Text>Are you sure you want to approve this report?</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Report #{report.id} will be published on the public dashboard.
          </Text>
        </Space>
      ),
      okText: 'Approve',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: () => handleAction(report.id, 'approved'),
    });
  };

  const showRejectConfirm = (report: Report) => {
    confirm({
      title: 'Reject Report',
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: (
        <Space direction="vertical">
          <Text>Are you sure you want to reject this report?</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Report #{report.id} will not be published and will be marked as rejected.
          </Text>
        </Space>
      ),
      okText: 'Reject',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: () => handleAction(report.id, 'rejected'),
    });
  };

  const showDetails = (report: Report) => {
    setSelectedReport(report);
    setDetailsVisible(true);
  };

  const columns = [
    {
      title: (
        <Space>
          <span>ID</span>
          <Tooltip title="Unique report identifier">
            <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: (
        <Space>
          <span>Platform</span>
          <Tooltip title="Social media platform where content was found">
            <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'platform',
      key: 'platform',
      width: 130,
      render: (platform: string) => (
        <Tag color={
          platform === 'twitter' ? 'blue' :
          platform === 'facebook' ? 'cyan' :
          platform === 'instagram' ? 'magenta' :
          platform === 'youtube' ? 'red' :
          platform === 'tiktok' ? 'purple' :
          platform === 'reddit' ? 'orange' : 'default'
        }>
          {platform.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: (
        <Space>
          <span>Content Type</span>
          <Tooltip title="Type of harmful content (post, video, comment, etc.)">
            <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'content_type',
      key: 'content_type',
      width: 130,
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 100,
    },
    {
      title: 'Language',
      dataIndex: 'language',
      key: 'language',
      width: 100,
    },
    {
      title: (
        <Space>
          <span>Reports</span>
          <Tooltip title="Number of times this content was reported">
            <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'report_count',
      key: 'report_count',
      width: 120,
      render: (count: number) => (
        <Tag color={count > 5 ? 'red' : count > 2 ? 'orange' : 'default'}>
          {count} {count === 1 ? 'report' : 'reports'}
        </Tag>
      ),
    },
    {
      title: 'Submitted',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          <Text style={{ fontSize: 13 }}>{new Date(date).toLocaleString()}</Text>
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: Report) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetails(record)}
          >
            Details
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => showApproveConfirm(record)}
            loading={actionLoading}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => showRejectConfirm(record)}
            loading={actionLoading}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={4}>
          <Title level={2} style={{ margin: 0 }}>Moderator Queue</Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Review submitted reports and approve or reject them. Approved reports will appear on the public dashboard.
          </Text>
        </Space>
      </Card>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            {statsLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  title="Pending Reports"
                  value={stats.pendingCount}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Awaiting moderation
                </Text>
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            {statsLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  title="Approved Today"
                  value={stats.approvedToday}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Published to dashboard
                </Text>
              </>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            {statsLoading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <>
                <Statistic
                  title="Rejected Today"
                  value={stats.rejectedToday}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Not published
                </Text>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Reports Table */}
      <Card>
        {loading && reports.length === 0 ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={reports}
            loading={loading && reports.length > 0}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} pending reports`,
            }}
            locale={{
              emptyText: (
                <Empty
                  description={
                    <Space direction="vertical">
                      <Text type="secondary">No pending reports</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        All reports have been reviewed
                      </Text>
                    </Space>
                  }
                />
              ),
            }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Card>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#1890ff' }} />
            <span>Report Details - #{selectedReport?.id}</span>
          </Space>
        }
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        width={900}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseOutlined />}
            onClick={() => selectedReport && showRejectConfirm(selectedReport)}
            loading={actionLoading}
          >
            Reject
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => selectedReport && showApproveConfirm(selectedReport)}
            loading={actionLoading}
          >
            Approve
          </Button>,
        ]}
      >
        {selectedReport && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Basic Information */}
            <div>
              <Title level={5} style={{ marginBottom: 16 }}>
                Basic Information
              </Title>
              <Descriptions bordered column={2} size="small">
                <Descriptions.Item label="Report ID">
                  <Text strong>#{selectedReport.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="orange">{selectedReport.status.toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Platform">
                  <Tag>{selectedReport.platform.toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Content Type">
                  <Tag>{selectedReport.content_type}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Country">
                  {selectedReport.country}
                </Descriptions.Item>
                <Descriptions.Item label="Language">
                  {selectedReport.language}
                </Descriptions.Item>
                <Descriptions.Item label="Activity Status">
                  <Tag color={selectedReport.activity_status === 'active' ? 'red' : 'green'}>
                    {selectedReport.activity_status.toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Report Count">
                  <Tag color={selectedReport.report_count > 5 ? 'red' : 'default'}>
                    {selectedReport.report_count} {selectedReport.report_count === 1 ? 'report' : 'reports'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Submitted At" span={2}>
                  <Space>
                    <ClockCircleOutlined />
                    <Text>{new Date(selectedReport.created_at).toLocaleString()}</Text>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Content Information */}
            <div>
              <Title level={5} style={{ marginBottom: 16 }}>
                Content Information
              </Title>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Content Link">
                  <a href={selectedReport.content_link} target="_blank" rel="noopener noreferrer">
                    <Space>
                      {selectedReport.content_link}
                      <LinkOutlined />
                    </Space>
                  </a>
                </Descriptions.Item>
                <Descriptions.Item label="Normalized Link">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {selectedReport.content_link_normalized}
                  </Text>
                </Descriptions.Item>
                {selectedReport.description && (
                  <Descriptions.Item label="Reporter's Description">
                    <Card size="small" style={{ background: '#fffbe6', marginTop: 8, border: '1px solid #ffe58f' }}>
                      <Text>{selectedReport.description}</Text>
                    </Card>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* Technical Information */}
            <div>
              <Title level={5} style={{ marginBottom: 16 }}>
                Technical Information
              </Title>
              <Descriptions bordered column={1} size="small">
                {selectedReport.submitter_ip_hash && (
                  <Descriptions.Item label="Submitter IP Hash">
                    <Text code style={{ fontSize: 11 }}>
                      {selectedReport.submitter_ip_hash}
                    </Text>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Public Display Preview">
                  <Card size="small" style={{ background: '#f0f5ff', marginTop: 8 }}>
                    <Text strong>
                      Content #{selectedReport.id} – {selectedReport.content_type} on {selectedReport.platform}
                    </Text>
                  </Card>
                </Descriptions.Item>
              </Descriptions>
            </div>
          </Space>
        )}
      </Modal>
    </div>
  );
};
