import React from "react";
import { Card, Row, Col, Statistic, Typography, Table } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useList } from "@refinedev/core";
import type { Report } from "../../types/schema";

const { Title } = Typography;

export const Statistics = () => {
  const { query } = useList<Report>({
    resource: "reports",
  });

  const { data: reportsData, isLoading } = query;
  const reports = reportsData?.data || [];

  // Calculate statistics
  const totalReports = reports.length;
  const pendingReports = reports.filter((r: Report) => r.status === "pending").length;
  const approvedReports = reports.filter((r: Report) => r.status === "approved" || r.status === "published").length;
  const rejectedReports = reports.filter((r: Report) => r.status === "rejected").length;

  // Group by platform
  const byPlatform = reports.reduce((acc: Record<string, number>, report: Report) => {
    acc[report.platform] = (acc[report.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const platformData = Object.entries(byPlatform).map(([platform, count]) => ({
    platform,
    count,
  }));

  // Group by country
  const byCountry = reports.reduce((acc: Record<string, number>, report: Report) => {
    acc[report.country] = (acc[report.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryData = Object.entries(byCountry).map(([country, count]) => ({
    country,
    count,
  }));

  // Group by status
  const activeContent = reports.filter((r: Report) => r.platform_status === "active").length;
  const removedContent = reports.filter((r: Report) => r.platform_status === "removed").length;

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2}>Statistics Dashboard</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Reports"
              value={totalReports}
              prefix={<FileTextOutlined />}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Pending Review"
              value={pendingReports}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Approved"
              value={approvedReports}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Rejected"
              value={rejectedReports}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Still Active"
              value={activeContent}
              valueStyle={{ color: "#ff4d4f" }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Removed by Platform"
              value={removedContent}
              valueStyle={{ color: "#52c41a" }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Removal Rate"
              value={totalReports > 0 ? ((removedContent / totalReports) * 100).toFixed(1) : 0}
              suffix="%"
              prefix={<GlobalOutlined />}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="Reports by Platform" loading={isLoading}>
            <Table
              dataSource={platformData}
              pagination={false}
              size="small"
              rowKey="platform"
            >
              <Table.Column dataIndex="platform" title="Platform" />
              <Table.Column dataIndex="count" title="Reports" />
            </Table>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Reports by Country" loading={isLoading}>
            <Table
              dataSource={countryData}
              pagination={false}
              size="small"
              rowKey="country"
            >
              <Table.Column dataIndex="country" title="Country" />
              <Table.Column dataIndex="count" title="Reports" />
            </Table>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
