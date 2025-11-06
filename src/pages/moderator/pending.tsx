import React, { useState, useEffect } from "react";
import { Card, Table, Space, Button, Modal, Tag, message, Typography, Descriptions } from "antd";
import { CheckOutlined, CloseOutlined, LinkOutlined, EyeOutlined } from "@ant-design/icons";
import type { Report } from "../../types/simplified-schema";

const { Title, Text } = Typography;

export const ModeratorPendingList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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

      // Refresh list
      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      message.error('An error occurred while updating the report');
    } finally {
      setActionLoading(false);
    }
  };

  const showDetails = (report: Report) => {
    setSelectedReport(report);
    setDetailsVisible(true);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      width: 120,
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
      title: 'Content Type',
      dataIndex: 'content_type',
      key: 'content_type',
      width: 120,
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
      title: 'Report Count',
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
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
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
            onClick={() => handleAction(record.id, 'approved')}
            loading={actionLoading}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseOutlined />}
            onClick={() => handleAction(record.id, 'rejected')}
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
      <Card style={{ marginBottom: 24 }}>
        <Title level={2}>Moderator Queue - Pending Reports</Title>
        <Text type="secondary">
          Review submitted reports and approve or reject them. Approved reports will appear on the public dashboard.
        </Text>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={reports}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} pending reports`,
          }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title={`Report Details - #${selectedReport?.id}`}
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>,
          <Button
            key="reject"
            danger
            icon={<CloseOutlined />}
            onClick={() => selectedReport && handleAction(selectedReport.id, 'rejected')}
            loading={actionLoading}
          >
            Reject
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => selectedReport && handleAction(selectedReport.id, 'approved')}
            loading={actionLoading}
          >
            Approve
          </Button>,
        ]}
      >
        {selectedReport && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Report ID">
                #{selectedReport.id}
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
                {new Date(selectedReport.created_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Content Link" span={2}>
                <a href={selectedReport.content_link} target="_blank" rel="noopener noreferrer">
                  {selectedReport.content_link} <LinkOutlined />
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Normalized Link" span={2}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {selectedReport.content_link_normalized}
                </Text>
              </Descriptions.Item>
              {selectedReport.description && (
                <Descriptions.Item label="Description (Context)" span={2}>
                  <Card size="small" style={{ background: '#fffbe6', marginTop: 8 }}>
                    <Text>{selectedReport.description}</Text>
                  </Card>
                </Descriptions.Item>
              )}
              {selectedReport.submitter_ip_hash && (
                <Descriptions.Item label="Submitter IP Hash" span={2}>
                  <Text code style={{ fontSize: 10 }}>
                    {selectedReport.submitter_ip_hash}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card size="small" title="Display Preview">
              <Text strong>Public Display:</Text>
              <br />
              <Text>Content #{selectedReport.id} – {selectedReport.content_type} on {selectedReport.platform}</Text>
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
};
