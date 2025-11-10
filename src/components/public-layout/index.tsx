import React from "react";
import { Layout, Menu, Typography, Space, Button, Divider } from "antd";
import { Link, useLocation } from "react-router";
import {
  HomeOutlined,
  FormOutlined,
  DashboardOutlined,
  BarChartOutlined,
  FileTextOutlined,
  LoginOutlined,
  InfoCircleOutlined,
  MailOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const location = useLocation();

  // Get current selected menu key based on path
  const getSelectedKey = () => {
    if (location.pathname === '/' || location.pathname === '') return 'home';
    if (location.pathname.startsWith('/reports/public')) return 'dashboard';
    if (location.pathname.startsWith('/reports/create')) return 'submit';
    if (location.pathname.startsWith('/statistics')) return 'statistics';
    if (location.pathname.startsWith('/policies')) return 'policies';
    return '';
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#fff", padding: "0 50px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", position: "sticky", top: 0, zIndex: 1000 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Space align="center" style={{ marginRight: 40 }}>
                <SafetyOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <Title level={3} style={{ margin: "16px 0", color: "#1890ff" }}>
                  Bright Pearl
                </Title>
              </Space>
            </Link>
            <Menu
              mode="horizontal"
              selectedKeys={[getSelectedKey()]}
              style={{ border: "none", flex: 1 }}
              items={[
                {
                  key: "home",
                  icon: <HomeOutlined />,
                  label: <Link to="/">Home</Link>,
                },
                {
                  key: "dashboard",
                  icon: <DashboardOutlined />,
                  label: <Link to="/reports/public">Dashboard</Link>,
                },
                {
                  key: "submit",
                  icon: <FormOutlined />,
                  label: <Link to="/reports/create">Submit Report</Link>,
                },
                {
                  key: "statistics",
                  icon: <BarChartOutlined />,
                  label: <Link to="/statistics">Statistics</Link>,
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
      <Footer style={{ background: "#001529", padding: "40px 50px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* Brand and Mission */}
            <div>
              <Space align="start" size="middle">
                <SafetyOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                <div>
                  <Title level={4} style={{ color: "#fff", margin: "0 0 8px 0" }}>
                    Bright Pearl
                  </Title>
                  <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
                    Tech for Good. Empowering Muslim communities to create a safer digital world.
                  </Text>
                </div>
              </Space>
            </div>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '16px 0' }} />

            {/* About Section */}
            <div>
              <Title level={5} style={{ color: "#fff", marginBottom: 12 }}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                About Bright Pearl
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, display: 'block', lineHeight: 1.8 }}>
                Bright Pearl is a community-driven platform dedicated to tracking and reporting islamophobic
                content across social media platforms. We believe in transparency, accountability, and collective
                action. Our mission is to protect Muslim communities worldwide by providing tools to report harmful
                content and track its removal. All data is handled with strict privacy standards and GDPR compliance.
              </Text>
            </div>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '16px 0' }} />

            {/* Quick Links */}
            <div>
              <Title level={5} style={{ color: "#fff", marginBottom: 12 }}>Quick Links</Title>
              <Space wrap size="large">
                <Link to="/" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                  <HomeOutlined style={{ marginRight: 6 }} />
                  Home
                </Link>
                <Link to="/reports/public" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                  <DashboardOutlined style={{ marginRight: 6 }} />
                  Dashboard
                </Link>
                <Link to="/reports/create" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                  <FormOutlined style={{ marginRight: 6 }} />
                  Submit Report
                </Link>
                <Link to="/statistics" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                  <BarChartOutlined style={{ marginRight: 6 }} />
                  Statistics
                </Link>
                <Link to="/policies" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                  <FileTextOutlined style={{ marginRight: 6 }} />
                  Privacy & Policies
                </Link>
                <a href="mailto:contact@brightpearl.org" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                  <MailOutlined style={{ marginRight: 6 }} />
                  Contact Us
                </a>
              </Space>
            </div>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.15)', margin: '16px 0' }} />

            {/* Copyright */}
            <div style={{ textAlign: "center" }}>
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                © 2025 Bright Pearl. All rights reserved. Building a safer digital future for Muslim communities worldwide.
              </Text>
            </div>
          </Space>
        </div>
      </Footer>
    </Layout>
  );
};
