import React from 'react';
import { Button, Row, Col, Card, Statistic, Typography, Space } from 'antd';
import {
  SafetyOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';

const { Title, Paragraph, Text } = Typography;

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ background: '#fff' }}>
      {/* Hero Section */}
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '80px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto' }}>
          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: 50,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 24,
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <ThunderboltOutlined /> Tech for Good
          </div>

          {/* Hero Title */}
          <Title
            level={1}
            style={{
              color: '#fff',
              fontSize: 'clamp(32px, 8vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: 24,
              textShadow: '0 2px 20px rgba(0,0,0,0.2)',
            }}
          >
            Protecting Muslim Communities<br />
            From Harmful Content
          </Title>

          {/* Hero Subtitle */}
          <Paragraph
            style={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: 'clamp(16px, 3vw, 20px)',
              lineHeight: 1.6,
              maxWidth: 700,
              margin: '0 auto 40px',
            }}
          >
            A bold platform empowering the global Muslim community to report, track, and eliminate harmful content across social media. Together, we're building a safer digital world for 2 billion voices.
          </Paragraph>

          {/* CTA Buttons */}
          <Space wrap style={{ justifyContent: 'center', marginBottom: 48 }}>
            <Button
              type="primary"
              size="large"
              icon={<SafetyOutlined />}
              onClick={() => navigate('/reports/create')}
              style={{
                height: 50,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 8,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
            >
              Report Harmful Content
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/reports/public')}
              style={{
                height: 50,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
              }}
            >
              View Dashboard
            </Button>
          </Space>

          {/* Stats */}
          <Row gutter={[24, 24]} style={{ maxWidth: 800, margin: '0 auto' }}>
            <Col xs={8}>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, marginBottom: 8 }}>
                  2B+
                </div>
                <div style={{ fontSize: 'clamp(12px, 2vw, 14px)', opacity: 0.9 }}>
                  Muslims Worldwide
                </div>
              </div>
            </Col>
            <Col xs={8}>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, marginBottom: 8 }}>
                  50+
                </div>
                <div style={{ fontSize: 'clamp(12px, 2vw, 14px)', opacity: 0.9 }}>
                  Countries
                </div>
              </div>
            </Col>
            <Col xs={8}>
              <div style={{ color: '#fff' }}>
                <div style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 700, marginBottom: 8 }}>
                  24/7
                </div>
                <div style={{ fontSize: 'clamp(12px, 2vw, 14px)', opacity: 0.9 }}>
                  Active
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Mission Section */}
      <div style={{ padding: 'clamp(40px, 8vw, 80px) 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Text
              style={{
                display: 'inline-block',
                padding: '6px 16px',
                background: '#e6f7ff',
                color: '#1890ff',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              Our Mission
            </Text>
            <Title level={2} style={{ marginBottom: 16, fontSize: 'clamp(24px, 5vw, 36px)' }}>
              Tech for Good. Action for Change.
            </Title>
            <Paragraph style={{ fontSize: 'clamp(14px, 2.5vw, 18px)', color: '#666', maxWidth: 700, margin: '0 auto' }}>
              We're leveraging advanced technology to create a global movement against harmful content targeting Muslim communities worldwide.
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{
                  height: '100%',
                  textAlign: 'center',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <GlobalOutlined style={{ fontSize: 32, color: '#fff' }} />
                </div>
                <Title level={4} style={{ marginBottom: 16, fontSize: 'clamp(18px, 3vw, 22px)' }}>
                  Global Reach
                </Title>
                <Paragraph style={{ color: '#666', fontSize: 'clamp(14px, 2vw, 16px)' }}>
                  Empowering Muslims across 50+ countries to protect their communities from hate speech, misinformation, and harmful content on major platforms.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{
                  height: '100%',
                  textAlign: 'center',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #fa8c16 0%, #faad14 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <ThunderboltOutlined style={{ fontSize: 32, color: '#fff' }} />
                </div>
                <Title level={4} style={{ marginBottom: 16, fontSize: 'clamp(18px, 3vw, 22px)' }}>
                  Rapid Response
                </Title>
                <Paragraph style={{ color: '#666', fontSize: 'clamp(14px, 2vw, 16px)' }}>
                  Fast-tracked reporting system with real-time monitoring and coordinated action to address harmful content within hours, not days.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                bordered={false}
                style={{
                  height: '100%',
                  textAlign: 'center',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                  }}
                >
                  <TeamOutlined style={{ fontSize: 32, color: '#fff' }} />
                </div>
                <Title level={4} style={{ marginBottom: 16, fontSize: 'clamp(18px, 3vw, 22px)' }}>
                  Community Powered
                </Title>
                <Paragraph style={{ color: '#666', fontSize: 'clamp(14px, 2vw, 16px)' }}>
                  Built by the community, for the community. Every report strengthens our collective voice and drives meaningful change.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ padding: 'clamp(40px, 8vw, 80px) 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Text
              style={{
                display: 'inline-block',
                padding: '6px 16px',
                background: '#fff7e6',
                color: '#fa8c16',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              Simple. Powerful. Effective.
            </Text>
            <Title level={2} style={{ marginBottom: 16, fontSize: 'clamp(24px, 5vw, 36px)' }}>
              How Bright Pearl Works
            </Title>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card bordered={false} style={{ textAlign: 'center', background: '#f0f5ff', borderRadius: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: '#1890ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  1
                </div>
                <Title level={4} style={{ marginBottom: 12, fontSize: 'clamp(18px, 3vw, 22px)' }}>
                  <SafetyOutlined style={{ marginRight: 8 }} />
                  Report
                </Title>
                <Paragraph style={{ color: '#666', fontSize: 'clamp(14px, 2vw, 16px)' }}>
                  Found harmful content? Submit a report with the link, platform, and description. Takes less than 60 seconds.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card bordered={false} style={{ textAlign: 'center', background: '#fff7e6', borderRadius: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: '#fa8c16',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  2
                </div>
                <Title level={4} style={{ marginBottom: 12, fontSize: 'clamp(18px, 3vw, 22px)' }}>
                  <RocketOutlined style={{ marginRight: 8 }} />
                  Track
                </Title>
                <Paragraph style={{ color: '#666', fontSize: 'clamp(14px, 2vw, 16px)' }}>
                  Our system aggregates identical reports, creating a unified voice. Track the status of your report in real-time.
                </Paragraph>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card bordered={false} style={{ textAlign: 'center', background: '#f6ffed', borderRadius: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: '#52c41a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: 20,
                    fontWeight: 700,
                  }}
                >
                  3
                </div>
                <Title level={4} style={{ marginBottom: 12, fontSize: 'clamp(18px, 3vw, 22px)' }}>
                  <CheckCircleOutlined style={{ marginRight: 8 }} />
                  Impact
                </Title>
                <Paragraph style={{ color: '#666', fontSize: 'clamp(14px, 2vw, 16px)' }}>
                  Moderators review and escalate high-priority content to platforms. See the real-world impact of community action.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Impact Stats */}
      <div style={{ padding: 'clamp(40px, 8vw, 80px) 24px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Text
              style={{
                display: 'inline-block',
                padding: '6px 16px',
                background: '#f6ffed',
                color: '#52c41a',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              Real Impact. Real Change.
            </Text>
            <Title level={2} style={{ marginBottom: 16, fontSize: 'clamp(24px, 5vw, 36px)' }}>
              Making a Difference Globally
            </Title>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={12} md={6}>
              <Card bordered={false} style={{ textAlign: 'center', borderRadius: 12 }}>
                <Statistic
                  title="Reports Submitted"
                  value={15000}
                  prefix={<SafetyOutlined />}
                  suffix="+"
                  valueStyle={{ color: '#1890ff', fontSize: 'clamp(24px, 4vw, 36px)' }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card bordered={false} style={{ textAlign: 'center', borderRadius: 12 }}>
                <Statistic
                  title="Content Removed"
                  value={8500}
                  prefix={<CheckCircleOutlined />}
                  suffix="+"
                  valueStyle={{ color: '#52c41a', fontSize: 'clamp(24px, 4vw, 36px)' }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card bordered={false} style={{ textAlign: 'center', borderRadius: 12 }}>
                <Statistic
                  title="Communities"
                  value={50}
                  prefix={<GlobalOutlined />}
                  suffix="+"
                  valueStyle={{ color: '#722ed1', fontSize: 'clamp(24px, 4vw, 36px)' }}
                />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card bordered={false} style={{ textAlign: 'center', borderRadius: 12 }}>
                <Statistic
                  title="Response Time"
                  value={24}
                  prefix={<ThunderboltOutlined />}
                  suffix="hrs"
                  valueStyle={{ color: '#fa8c16', fontSize: 'clamp(24px, 4vw, 36px)' }}
                />
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Final CTA */}
      <div
        style={{
          padding: 'clamp(60px, 10vw, 100px) 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Title level={2} style={{ color: '#fff', marginBottom: 24, fontSize: 'clamp(24px, 5vw, 42px)' }}>
            Ready to Make an Impact?
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.95)', fontSize: 'clamp(16px, 3vw, 20px)', marginBottom: 40 }}>
            Join thousands of community members protecting Muslim voices online. Your report can make a difference.
          </Paragraph>

          <Space wrap style={{ justifyContent: 'center', marginBottom: 32 }}>
            <Button
              type="primary"
              size="large"
              icon={<SafetyOutlined />}
              onClick={() => navigate('/reports/create')}
              style={{
                height: 56,
                fontSize: 18,
                fontWeight: 600,
                borderRadius: 8,
                background: '#fff',
                color: '#667eea',
                border: 'none',
              }}
            >
              Submit a Report Now
              <ArrowRightOutlined />
            </Button>
            <Button
              size="large"
              icon={<DashboardOutlined />}
              onClick={() => navigate('/reports/public')}
              style={{
                height: 56,
                fontSize: 18,
                fontWeight: 600,
                borderRadius: 8,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
              }}
            >
              View Public Dashboard
            </Button>
          </Space>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(255,255,255,0.9)' }}>
            <CheckCircleOutlined />
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 'clamp(12px, 2vw, 14px)' }}>
              Your privacy is protected. All reports are handled securely and confidentially.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};
