import React, { useState } from "react";
import { Layout, Menu, Typography, Space, Button, Row, Col, Modal, Form, Input, message } from "antd";
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
const { Title, Text, Paragraph } = Typography;

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactForm] = Form.useForm();

  // Get current selected menu key based on path
  const getSelectedKey = () => {
    if (location.pathname === '/' || location.pathname === '') return 'home';
    if (location.pathname.startsWith('/reports/public')) return 'dashboard';
    if (location.pathname.startsWith('/reports/create')) return 'submit';
    if (location.pathname.startsWith('/statistics')) return 'statistics';
    if (location.pathname.startsWith('/policies')) return 'policies';
    return '';
  };

  const handleContactSubmit = (values: any) => {
    // In production, this would send an email via API
    console.log('Contact form submitted:', values);
    message.success('Thank you for contacting us! We will get back to you soon.');
    setContactModalVisible(false);
    contactForm.resetFields();
  };

  const menuItems = [
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
      label: <Link to="/reports/create">Submit</Link>,
    },
    {
      key: "statistics",
      icon: <BarChartOutlined />,
      label: <Link to="/statistics">Stats</Link>,
    },
    {
      key: "policies",
      icon: <FileTextOutlined />,
      label: <Link to="/policies">Policies</Link>,
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop/Tablet Header - Hidden on mobile */}
      <Header
        className="desktop-header"
        style={{
          background: "#fff",
          padding: "0 50px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 1000
        }}
      >
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
              items={menuItems}
            />
          </div>
          <Button
            type="primary"
            icon={<MailOutlined />}
            onClick={() => setContactModalVisible(true)}
          >
            Contact Us
          </Button>
        </div>
      </Header>

      {/* Mobile Header - Only logo and contact */}
      <Header
        className="mobile-header"
        style={{
          background: "#fff",
          padding: "0 16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 1000,
          display: "none"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Space align="center">
              <SafetyOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <Title level={4} style={{ margin: "16px 0", color: "#1890ff" }}>
                Bright Pearl
              </Title>
            </Space>
          </Link>
          <Button
            type="text"
            icon={<MailOutlined style={{ fontSize: 20 }} />}
            onClick={() => setContactModalVisible(true)}
          />
        </div>
      </Header>

      <Content style={{ padding: "24px 50px", background: "#f0f2f5", paddingBottom: 80 }}>
        {children}
      </Content>

      {/* Mobile Bottom Navigation - Instagram style */}
      <div
        className="mobile-bottom-nav"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
          zIndex: 1000,
          padding: '8px 0',
        }}
      >
        <Menu
          mode="horizontal"
          selectedKeys={[getSelectedKey()]}
          style={{
            border: "none",
            display: 'flex',
            justifyContent: 'space-around',
            background: 'transparent'
          }}
          items={menuItems.map(item => ({
            ...item,
            label: item.key === 'submit' ? (
              <Link to="/reports/create" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 11 }}>
                <FormOutlined style={{ fontSize: 22 }} />
                <span>Submit</span>
              </Link>
            ) : item.key === 'dashboard' ? (
              <Link to="/reports/public" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 11 }}>
                <DashboardOutlined style={{ fontSize: 22 }} />
                <span>Dashboard</span>
              </Link>
            ) : item.key === 'home' ? (
              <Link to="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 11 }}>
                <HomeOutlined style={{ fontSize: 22 }} />
                <span>Home</span>
              </Link>
            ) : item.key === 'statistics' ? (
              <Link to="/statistics" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 11 }}>
                <BarChartOutlined style={{ fontSize: 22 }} />
                <span>Stats</span>
              </Link>
            ) : (
              <Link to="/policies" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: 11 }}>
                <FileTextOutlined style={{ fontSize: 22 }} />
                <span>Policies</span>
              </Link>
            ),
            icon: null,
          }))}
        />
      </div>

      {/* Footer - 3 Column Layout */}
      <Footer style={{ background: "#001529", padding: "40px 50px 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Row gutter={[32, 32]}>
            {/* Column 1: Logo & Tagline */}
            <Col xs={24} sm={24} md={8}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Space align="start" size="middle">
                  <SafetyOutlined style={{ fontSize: 32, color: '#1890ff' }} />
                  <div>
                    <Title level={4} style={{ color: "#fff", margin: "0 0 4px 0" }}>
                      Bright Pearl
                    </Title>
                    <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                      Tech for Good
                    </Text>
                  </div>
                </Space>
                <Paragraph style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: 0 }}>
                  Empowering Muslim communities to create a safer digital world through collective action.
                </Paragraph>
                {/* Moderator Login in Footer */}
                <Link to="/login">
                  <Button
                    type="default"
                    icon={<LoginOutlined />}
                    size="small"
                    style={{ marginTop: 8 }}
                  >
                    Moderator Login
                  </Button>
                </Link>
              </Space>
            </Col>

            {/* Column 2: Quick Links */}
            <Col xs={24} sm={12} md={8}>
              <Title level={5} style={{ color: "#fff", marginBottom: 16 }}>
                Quick Links
              </Title>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Link to="/" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, display: 'block' }}>
                  <HomeOutlined style={{ marginRight: 8 }} />
                  Home
                </Link>
                <Link to="/reports/public" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, display: 'block' }}>
                  <DashboardOutlined style={{ marginRight: 8 }} />
                  Public Dashboard
                </Link>
                <Link to="/reports/create" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, display: 'block' }}>
                  <FormOutlined style={{ marginRight: 8 }} />
                  Submit Report
                </Link>
                <Link to="/statistics" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, display: 'block' }}>
                  <BarChartOutlined style={{ marginRight: 8 }} />
                  Statistics
                </Link>
                <Link to="/policies" style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, display: 'block' }}>
                  <FileTextOutlined style={{ marginRight: 8 }} />
                  Privacy & Policies
                </Link>
                <a
                  onClick={() => setContactModalVisible(true)}
                  style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, display: 'block', cursor: 'pointer' }}
                >
                  <MailOutlined style={{ marginRight: 8 }} />
                  Contact Us
                </a>
              </Space>
            </Col>

            {/* Column 3: About */}
            <Col xs={24} sm={12} md={8}>
              <Title level={5} style={{ color: "#fff", marginBottom: 16 }}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                About
              </Title>
              <Paragraph style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, margin: 0, lineHeight: 1.8 }}>
                Bright Pearl is a community-driven platform dedicated to tracking and reporting islamophobic content across social media platforms. We believe in transparency, accountability, and collective action.
              </Paragraph>
              <Paragraph style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginTop: 12, lineHeight: 1.8 }}>
                All data is handled with strict privacy standards and GDPR compliance. Available in multiple languages, supporting communities across 50+ countries.
              </Paragraph>
            </Col>
          </Row>

          {/* Copyright */}
          <div style={{ textAlign: "center", marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
              © 2025 Bright Pearl. All rights reserved. Building a safer digital future for Muslim communities worldwide.
            </Text>
          </div>
        </div>
      </Footer>

      {/* Contact Modal */}
      <Modal
        title={
          <Space>
            <MailOutlined style={{ color: '#1890ff' }} />
            <span>Contact Us</span>
          </Space>
        }
        open={contactModalVisible}
        onCancel={() => setContactModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={contactForm}
          layout="vertical"
          onFinish={handleContactSubmit}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter your name' }]}
          >
            <Input placeholder="Your name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="your.email@example.com" />
          </Form.Item>

          <Form.Item
            label="Subject"
            name="subject"
            rules={[{ required: true, message: 'Please enter a subject' }]}
          >
            <Input placeholder="What is this regarding?" />
          </Form.Item>

          <Form.Item
            label="Message"
            name="message"
            rules={[{ required: true, message: 'Please enter your message' }]}
          >
            <Input.TextArea
              rows={6}
              placeholder="Your message..."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setContactModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" icon={<MailOutlined />}>
                Send Message
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 24, padding: 16, background: '#f0f5ff', borderRadius: 8 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            You can also reach us at: <a href="mailto:contact@brightpearl.org">contact@brightpearl.org</a>
          </Text>
        </div>
      </Modal>

      {/* Responsive Styles */}
      <style>{`
        /* Mobile styles */
        @media (max-width: 767px) {
          .desktop-header {
            display: none !important;
          }

          .mobile-header {
            display: flex !important;
          }

          .mobile-bottom-nav {
            display: block !important;
          }

          .ant-layout-content {
            padding: 16px !important;
            padding-bottom: 80px !important;
          }

          .ant-layout-footer {
            padding: 24px 16px 80px !important;
          }

          /* Make bottom nav icons more touch-friendly */
          .mobile-bottom-nav .ant-menu-item {
            padding: 8px 4px !important;
            height: auto !important;
            line-height: 1 !important;
          }

          .mobile-bottom-nav .ant-menu-item a {
            padding: 4px 0 !important;
          }
        }

        /* Tablet styles */
        @media (min-width: 768px) and (max-width: 1023px) {
          .ant-layout-header {
            padding: 0 24px !important;
          }

          .ant-layout-content {
            padding: 24px !important;
          }

          .ant-layout-footer {
            padding: 32px 24px !important;
          }
        }

        /* Desktop styles */
        @media (min-width: 1024px) {
          .mobile-header {
            display: none !important;
          }

          .mobile-bottom-nav {
            display: none !important;
          }
        }

        /* Bottom nav active state */
        .mobile-bottom-nav .ant-menu-item-selected a {
          color: #1890ff !important;
        }

        /* Remove default menu item spacing on mobile bottom nav */
        .mobile-bottom-nav .ant-menu-horizontal {
          line-height: 1 !important;
        }

        .mobile-bottom-nav .ant-menu-item {
          border-bottom: 2px solid transparent !important;
        }

        .mobile-bottom-nav .ant-menu-item-selected {
          border-bottom-color: #1890ff !important;
        }
      `}</style>
    </Layout>
  );
};
