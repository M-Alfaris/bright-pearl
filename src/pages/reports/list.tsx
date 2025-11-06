import React, { useState, useEffect } from "react";
import { Card, Table, Space, Button, Tag, message, Typography, Select, Input } from "antd";
import { EyeOutlined, EditOutlined, LinkOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router";
import type { Report } from "../../types/simplified-schema";

const { Title, Text } = Typography;
const { Search } = Input;

export const ReportList: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    platform: undefined as string | undefined,
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const authToken = localStorage.getItem('sb-access-token');

      if (!authToken) {
        message.error('Please log in to access this page');
        return;
      }

      let query = `${supabaseUrl}/rest/v1/reports?order=created_at.desc`;

      if (filters.status) {
        query += `&status=eq.${filters.status}`;
      }
      if (filters.platform) {
        query += `&platform=eq.${filters.platform}`;
      }

      const response = await fetch(query, {
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
      message.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filters]);

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
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={
          status === 'approved' ? 'green' :
          status === 'rejected' ? 'red' : 'orange'
        }>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Activity',
      dataIndex: 'activity_status',
      key: 'activity_status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'red' : 'green'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Reports',
      dataIndex: 'report_count',
      key: 'report_count',
      width: 100,
      render: (count: number) => (
        <Tag color={count > 5 ? 'red' : count > 2 ? 'orange' : 'default'}>
          {count}
        </Tag>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'country',
      key: 'country',
      width: 100,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: Report) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/reports/show/${record.id}`)}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/reports/edit/${record.id}`)}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Title level={2}>All Reports</Title>
        <Text type="secondary">
          Manage all submitted reports. Filter by status and platform.
        </Text>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            style={{ width: 150 }}
            placeholder="Filter by status"
            allowClear
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="approved">Approved</Select.Option>
            <Select.Option value="rejected">Rejected</Select.Option>
          </Select>

          <Select
            style={{ width: 150 }}
            placeholder="Filter by platform"
            allowClear
            value={filters.platform}
            onChange={(value) => setFilters({ ...filters, platform: value })}
          >
            <Select.Option value="twitter">Twitter/X</Select.Option>
            <Select.Option value="facebook">Facebook</Select.Option>
            <Select.Option value="instagram">Instagram</Select.Option>
            <Select.Option value="youtube">YouTube</Select.Option>
            <Select.Option value="tiktok">TikTok</Select.Option>
            <Select.Option value="reddit">Reddit</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={reports}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} reports`,
          }}
        />
      </Card>
    </div>
  );
};
