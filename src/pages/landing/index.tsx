import React, { useEffect, useState } from 'react';
import { Button, Row, Col, Card, Statistic, Typography } from 'antd';
import {
  SafetyOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router';
import './landing.css';

const { Title, Paragraph, Text } = Typography;

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className={`hero-section ${isVisible ? 'fade-in' : ''}`}>
        <div className="hero-background">
          <div className="gradient-overlay"></div>
          <div className="animated-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>

        <div className="hero-content container">
          <div className="hero-badge">
            <ThunderboltOutlined /> Tech for Good
          </div>

          <Title level={1} className="hero-title">
            Protecting Muslim Communities
            <br />
            <span className="gradient-text">From Harmful Content</span>
          </Title>

          <Paragraph className="hero-subtitle">
            A bold platform empowering the global Muslim community to report,
            track, and eliminate harmful content across social media. Together,
            we're building a safer digital world for 2 billion voices.
          </Paragraph>

          <div className="hero-cta">
            <Button
              type="primary"
              size="large"
              icon={<SafetyOutlined />}
              onClick={() => navigate('/reports/create')}
              className="cta-primary"
            >
              Report Harmful Content
            </Button>
            <Button
              size="large"
              onClick={() => scrollToSection('how-it-works')}
              className="cta-secondary"
            >
              Learn How It Works
            </Button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <div className="stat-number">2B+</div>
              <div className="stat-label">Muslims Worldwide</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Countries Covered</div>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Active Monitoring</div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator" onClick={() => scrollToSection('mission')}>
          <div className="scroll-arrow"></div>
        </div>
      </section>

      {/* Mission Section */}
      <section id="mission" className="mission-section container">
        <div className="section-header">
          <Text className="section-tag">Our Mission</Text>
          <Title level={2}>Tech for Good. Action for Change.</Title>
          <Paragraph className="section-description">
            We're leveraging advanced technology to create a global movement
            against harmful content targeting Muslim communities worldwide.
          </Paragraph>
        </div>

        <Row gutter={[32, 32]} className="mission-grid">
          <Col xs={24} md={8}>
            <Card className="mission-card" bordered={false}>
              <div className="mission-icon">
                <GlobalOutlined />
              </div>
              <Title level={3}>Global Reach</Title>
              <Paragraph>
                Empowering Muslims across 50+ countries to protect their
                communities from hate speech, misinformation, and harmful
                content on major platforms.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card className="mission-card" bordered={false}>
              <div className="mission-icon">
                <ThunderboltOutlined />
              </div>
              <Title level={3}>Rapid Response</Title>
              <Paragraph>
                Fast-tracked reporting system with real-time monitoring and
                coordinated action to address harmful content within hours, not
                days.
              </Paragraph>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card className="mission-card" bordered={false}>
              <div className="mission-icon">
                <TeamOutlined />
              </div>
              <Title level={3}>Community Powered</Title>
              <Paragraph>
                Built by the community, for the community. Every report
                strengthens our collective voice and drives meaningful change.
              </Paragraph>
            </Card>
          </Col>
        </Row>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <Text className="section-tag">Simple. Powerful. Effective.</Text>
            <Title level={2}>How Bright Pearl Works</Title>
          </div>

          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">01</div>
              <div className="step-content">
                <Title level={3}>Report</Title>
                <Paragraph>
                  Found harmful content? Submit a report with the link, platform,
                  and description. It takes less than 60 seconds.
                </Paragraph>
              </div>
              <div className="step-visual">
                <SafetyOutlined />
              </div>
            </div>

            <div className="step-connector"></div>

            <div className="step-item">
              <div className="step-number">02</div>
              <div className="step-content">
                <Title level={3}>Track</Title>
                <Paragraph>
                  Our system aggregates identical reports, creating a unified
                  voice. Track the status of your report in real-time.
                </Paragraph>
              </div>
              <div className="step-visual">
                <RocketOutlined />
              </div>
            </div>

            <div className="step-connector"></div>

            <div className="step-item">
              <div className="step-number">03</div>
              <div className="step-content">
                <Title level={3}>Impact</Title>
                <Paragraph>
                  Moderators review and escalate high-priority content to
                  platforms. See the real-world impact of community action.
                </Paragraph>
              </div>
              <div className="step-visual">
                <CheckCircleOutlined />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="impact-section container">
        <div className="section-header">
          <Text className="section-tag">Real Impact. Real Change.</Text>
          <Title level={2}>Making a Difference Globally</Title>
          <Paragraph className="section-description">
            Every report contributes to a safer digital space for Muslim
            communities worldwide.
          </Paragraph>
        </div>

        <Row gutter={[48, 48]} align="middle">
          <Col xs={24} lg={12}>
            <div className="impact-stats-grid">
              <Card className="stat-card" bordered={false}>
                <Statistic
                  title="Reports Submitted"
                  value={15000}
                  prefix={<SafetyOutlined />}
                  suffix="+"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>

              <Card className="stat-card" bordered={false}>
                <Statistic
                  title="Content Removed"
                  value={8500}
                  prefix={<CheckCircleOutlined />}
                  suffix="+"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>

              <Card className="stat-card" bordered={false}>
                <Statistic
                  title="Active Communities"
                  value={50}
                  prefix={<GlobalOutlined />}
                  suffix="+"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>

              <Card className="stat-card" bordered={false}>
                <Statistic
                  title="Response Time"
                  value={24}
                  prefix={<ThunderboltOutlined />}
                  suffix="hrs"
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div className="impact-content">
              <Title level={3}>Protecting Communities Across Platforms</Title>
              <Paragraph>
                From YouTube to Facebook, Instagram to Twitter, Bright Pearl
                monitors harmful content across all major social media
                platforms where Muslim communities are targeted.
              </Paragraph>

              <div className="impact-list">
                <div className="impact-item">
                  <CheckCircleOutlined className="impact-check" />
                  <Text>Hate speech and Islamophobic content</Text>
                </div>
                <div className="impact-item">
                  <CheckCircleOutlined className="impact-check" />
                  <Text>Misinformation and propaganda</Text>
                </div>
                <div className="impact-item">
                  <CheckCircleOutlined className="impact-check" />
                  <Text>Harassment and targeted attacks</Text>
                </div>
                <div className="impact-item">
                  <CheckCircleOutlined className="impact-check" />
                  <Text>Violent and extremist content</Text>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-background">
          <div className="gradient-overlay"></div>
        </div>

        <div className="cta-content container">
          <Title level={2} className="cta-title">
            Ready to Make an Impact?
          </Title>
          <Paragraph className="cta-subtitle">
            Join thousands of community members protecting Muslim voices online.
            Your report can make a difference.
          </Paragraph>

          <div className="cta-buttons">
            <Button
              type="primary"
              size="large"
              icon={<SafetyOutlined />}
              onClick={() => navigate('/reports/create')}
              className="cta-primary-btn"
            >
              Submit a Report Now
              <ArrowRightOutlined />
            </Button>
            <Button
              size="large"
              onClick={() => navigate('/reports/public')}
              className="cta-secondary-btn"
            >
              View Public Reports
            </Button>
          </div>

          <div className="cta-assurance">
            <CheckCircleOutlined /> Your privacy is protected. All reports are
            handled securely and confidentially.
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <Row gutter={[32, 32]}>
            <Col xs={24} md={12}>
              <Title level={4} style={{ color: '#fff' }}>
                Bright Pearl
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.7)' }}>
                Tech for Good. Empowering Muslim communities to create a safer
                digital world through collective action and advanced technology.
              </Paragraph>
            </Col>

            <Col xs={24} md={12}>
              <Title level={4} style={{ color: '#fff' }}>
                Global Coverage
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.7)' }}>
                Supporting communities across North America, Europe, Middle East,
                Asia, Africa, and beyond. Available in multiple languages
                including English and Arabic.
              </Paragraph>
            </Col>
          </Row>

          <div className="footer-bottom">
            <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
              © 2025 Bright Pearl. Building a safer digital future for all.
            </Text>
          </div>
        </div>
      </footer>
    </div>
  );
};
