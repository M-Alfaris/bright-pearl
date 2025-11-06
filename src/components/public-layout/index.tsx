import React from "react";
import { Layout, Menu, Typography, Space, Button } from "antd";
import { Link } from "react-router";
import {
  HomeOutlined,
  FormOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  LoginOutlined,
} from "@ant-design/icons";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#fff", padding: "0 50px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Title level={3} style={{ margin: "16px 0", marginRight: 40, color: "#1890ff" }}>
              Bright Pearl
            </Title>
            <Menu
              mode="horizontal"
              style={{ border: "none", flex: 1 }}
              items={[
                {
                  key: "dashboard",
                  icon: <HomeOutlined />,
                  label: <Link to="/dashboard">Dashboard</Link>,
                },
                {
                  key: "submit",
                  icon: <FormOutlined />,
                  label: <Link to="/submit">Submit Report</Link>,
                },
                {
                  key: "statistics",
                  icon: <BarChartOutlined />,
                  label: <Link to="/statistics">Statistics</Link>,
                },
                {
                  key: "about",
                  icon: <InfoCircleOutlined />,
                  label: <Link to="/about">About</Link>,
                },
                {
                  key: "policies",
                  icon: <FileTextOutlined />,
                  label: <Link to="/policies">Policies</Link>,
                },
              ]}
            />
          </div>
          <Link to="/login">
            <Button type="primary" icon={<LoginOutlined />}>
              Moderator Login
            </Button>
          </Link>
        </div>
      </Header>
      <Content style={{ padding: "24px 50px", background: "#f0f2f5" }}>
        {children}
      </Content>
      <Footer style={{ textAlign: "center", background: "#fff" }}>
        <Space direction="vertical" size="small">
          <div>
            <strong>Bright Pearl</strong> - Tracking islamophobic content for transparency and action
          </div>
          <div style={{ fontSize: "12px", color: "#666" }}>
            <Link to="/about" style={{ marginRight: 16 }}>About</Link>
            <Link to="/policies" style={{ marginRight: 16 }}>Policies</Link>
            <a href="mailto:contact@brightpearl.org">Contact</a>
          </div>
          <div style={{ fontSize: "12px", color: "#999" }}>
            © 2025 Bright Pearl. All rights reserved.
          </div>
        </Space>
      </Footer>
    </Layout>
  );
};
