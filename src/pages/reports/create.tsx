import React, { useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  message,
  Space,
  Steps,
  Result,
  Descriptions,
  Tooltip,
  Divider,
  Row,
  Col,
  Badge,
} from "antd";
import {
  SendOutlined,
  LinkOutlined,
  GlobalOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";
import type { Platform } from "../../types/simplified-schema";

const { Title, Paragraph, Text } = Typography;

export const ReportCreate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | undefined>();
  const [reportResult, setReportResult] = useState<{
    report_id: number;
    report_count: number;
    message: string;
  } | null>(null);

  const CONTENT_TYPES_MAP: Record<Platform, string[]> = {
    twitter: ['tweet', 'reply', 'retweet', 'quote'],
    facebook: ['post', 'comment', 'share', 'reel'],
    instagram: ['post', 'story', 'reel', 'comment'],
    youtube: ['video', 'comment', 'short'],
    tiktok: ['video', 'comment'],
    reddit: ['post', 'comment'],
    other: ['content'],
  };

  const PLATFORM_OPTIONS = [
    { label: "Twitter/X", value: "twitter", icon: "𝕏" },
    { label: "Facebook", value: "facebook", icon: "f" },
    { label: "Instagram", value: "instagram", icon: "📷" },
    { label: "YouTube", value: "youtube", icon: "▶" },
    { label: "TikTok", value: "tiktok", icon: "🎵" },
    { label: "Reddit", value: "reddit", icon: "🤖" },
    { label: "Other", value: "other", icon: "..." },
  ];

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/submit-report-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          content_link: values.content_link,
          platform: values.platform,
          country: values.country,
          language: values.language,
          content_type: values.content_type,
          description: values.description || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          message.error({
            content: data.message || 'Rate limit exceeded. Please try again later.',
            duration: 5,
          });
        } else {
          message.error(data.error || 'Failed to submit report');
        }
        return;
      }

      setReportResult({
        report_id: data.report_id,
        report_count: data.report_count,
        message: data.message,
      });
      setSubmitted(true);
      form.resetFields();
      setCurrentStep(0);
      message.success({
        content: 'Report submitted successfully!',
        duration: 3,
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      message.error('An error occurred while submitting your report');
    } finally {
      setLoading(false);
    }
  };

  const handlePlatformChange = (value: Platform) => {
    setSelectedPlatform(value);
    form.setFieldValue('content_type', undefined);
  };

  const onStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const nextStep = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['platform', 'content_type', 'content_link']);
        setCurrentStep(1);
      } else if (currentStep === 1) {
        await form.validateFields(['country', 'language']);
        setCurrentStep(2);
      }
    } catch (error) {
      // Validation failed, stay on current step
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Success State
  if (submitted && reportResult) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
        <Result
          status="success"
          icon={<CheckCircleOutlined style={{ color: '#52c41a', fontSize: 72 }} />}
          title={<Title level={2} style={{ marginTop: 24 }}>Report Submitted Successfully!</Title>}
          subTitle={
            <Space direction="vertical" size="large" style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 16 }}>
                Thank you for helping protect our community. Your report has been received and will be reviewed by our moderation team.
              </Text>
            </Space>
          }
          extra={[
            <Card key="details" style={{ textAlign: 'left', marginTop: 24 }} bordered>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={<Text strong>Report ID</Text>}>
                  <Badge
                    count={`#${reportResult.report_id}`}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                </Descriptions.Item>
                <Descriptions.Item label={<Text strong>Total Reports for this Content</Text>}>
                  <Badge
                    count={reportResult.report_count}
                    style={{
                      backgroundColor: reportResult.report_count > 10 ? '#ff4d4f' : '#faad14'
                    }}
                    showZero
                  />
                  <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                    {reportResult.report_count === 1 ? 'First report' : 'Multiple reports submitted'}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label={<Text strong>Review Time</Text>}>
                  <Text type="secondary">Typically 24-48 hours</Text>
                </Descriptions.Item>
              </Descriptions>

              <Divider />

              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Text strong>What happens next?</Text>
                <ol style={{ paddingLeft: 20, margin: '8px 0' }}>
                  <li>
                    <Text type="secondary">Our moderators will review your report</Text>
                  </li>
                  <li>
                    <Text type="secondary">If approved, it will appear on the public dashboard</Text>
                  </li>
                  <li>
                    <Text type="secondary">The platform will be notified about the content</Text>
                  </li>
                </ol>
              </Space>
            </Card>,
            <Space key="actions" size="middle" style={{ marginTop: 24 }}>
              <Button
                type="primary"
                size="large"
                onClick={() => navigate('/reports/public')}
                icon={<GlobalOutlined />}
              >
                View Public Dashboard
              </Button>
              <Button
                size="large"
                onClick={() => {
                  setSubmitted(false);
                  setReportResult(null);
                }}
              >
                Submit Another Report
              </Button>
            </Space>
          ]}
        />
      </div>
    );
  }

  // Form State - Multi-step Form
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <SafetyOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
        <Title level={2} style={{ marginBottom: 8 }}>Submit a Report</Title>
        <Paragraph type="secondary" style={{ fontSize: 16, maxWidth: 600, margin: '0 auto' }}>
          Report harmful content targeting Muslim communities. Your submission helps us track and address islamophobic content across social media platforms.
        </Paragraph>
      </div>

      {/* Progress Steps */}
      <Card style={{ marginBottom: 32 }} bordered={false}>
        <Steps
          current={currentStep}
          onChange={onStepChange}
          items={[
            {
              title: 'Content Details',
              icon: <LinkOutlined />,
              description: 'Platform & URL',
            },
            {
              title: 'Location',
              icon: <GlobalOutlined />,
              description: 'Country & Language',
            },
            {
              title: 'Context',
              icon: <FileTextOutlined />,
              description: 'Additional Info',
            },
          ]}
        />
      </Card>

      {/* Form */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          {/* Step 1: Content Details */}
          {currentStep === 0 && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Content Information</Title>
                <Text type="secondary">Tell us where the harmful content is located</Text>
              </div>

              <Form.Item
                label={
                  <Space>
                    <span>Platform</span>
                    <Tooltip title="Select the social media platform where the harmful content is posted">
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  </Space>
                }
                name="platform"
                rules={[{ required: true, message: "Please select a platform" }]}
              >
                <Select
                  placeholder="Select the social media platform"
                  onChange={handlePlatformChange}
                  options={PLATFORM_OPTIONS.map(opt => ({
                    label: (
                      <Space>
                        <span style={{ fontSize: 18 }}>{opt.icon}</span>
                        {opt.label}
                      </Space>
                    ),
                    value: opt.value,
                  }))}
                  showSearch
                />
              </Form.Item>

              <Form.Item
                label={
                  <Space>
                    <span>Content Type</span>
                    <Tooltip title="What type of content is it? (post, video, comment, etc.)">
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  </Space>
                }
                name="content_type"
                rules={[{ required: true, message: "Please select content type" }]}
              >
                <Select
                  placeholder={selectedPlatform ? "Select content type" : "Select a platform first"}
                  disabled={!selectedPlatform}
                  options={
                    selectedPlatform
                      ? CONTENT_TYPES_MAP[selectedPlatform].map((type) => ({
                          label: type.charAt(0).toUpperCase() + type.slice(1),
                          value: type,
                        }))
                      : []
                  }
                />
              </Form.Item>

              <Form.Item
                label={
                  <Space>
                    <span>Content URL</span>
                    <Tooltip title="Direct link to the harmful content (post, video, comment, etc.)">
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  </Space>
                }
                name="content_link"
                rules={[
                  { required: true, message: "Please enter the URL" },
                  { type: "url", message: "Please enter a valid URL" },
                ]}
              >
                <Input
                  prefix={<LinkOutlined />}
                  placeholder="https://twitter.com/example/status/..."
                  size="large"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={24}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={nextStep}
                  >
                    Next: Location Information
                  </Button>
                </Col>
              </Row>
            </Space>
          )}

          {/* Step 2: Location */}
          {currentStep === 1 && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Location Information</Title>
                <Text type="secondary">Help us understand the geographic context</Text>
              </div>

              <Form.Item
                label="Country"
                name="country"
                rules={[{ required: true, message: "Please select a country" }]}
                initialValue="US"
              >
                <Select
                  placeholder="Select country where content originates"
                  showSearch
                  options={[
                    { label: "🇺🇸 United States", value: "US" },
                    { label: "🇬🇧 United Kingdom", value: "GB" },
                    { label: "🇫🇷 France", value: "FR" },
                    { label: "🇩🇪 Germany", value: "DE" },
                    { label: "🇮🇳 India", value: "IN" },
                    { label: "🇵🇰 Pakistan", value: "PK" },
                    { label: "🇹🇷 Turkey", value: "TR" },
                    { label: "🇸🇦 Saudi Arabia", value: "SA" },
                    { label: "🇦🇪 United Arab Emirates", value: "AE" },
                    { label: "🇨🇦 Canada", value: "CA" },
                    { label: "🇦🇺 Australia", value: "AU" },
                    { label: "🌍 Other", value: "OT" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label="Language"
                name="language"
                rules={[{ required: true, message: "Please select a language" }]}
                initialValue="en"
              >
                <Select
                  placeholder="Select language of the content"
                  showSearch
                  options={[
                    { label: "English", value: "en" },
                    { label: "Arabic (العربية)", value: "ar" },
                    { label: "French (Français)", value: "fr" },
                    { label: "German (Deutsch)", value: "de" },
                    { label: "Spanish (Español)", value: "es" },
                    { label: "Urdu (اردو)", value: "ur" },
                    { label: "Turkish (Türkçe)", value: "tr" },
                    { label: "Hindi (हिन्दी)", value: "hi" },
                    { label: "Other", value: "other" },
                  ]}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Button size="large" block onClick={prevStep}>
                    Back
                  </Button>
                </Col>
                <Col span={12}>
                  <Button type="primary" size="large" block onClick={nextStep}>
                    Next: Additional Context
                  </Button>
                </Col>
              </Row>
            </Space>
          )}

          {/* Step 3: Context (Optional) */}
          {currentStep === 2 && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>Additional Context (Optional)</Title>
                <Text type="secondary">
                  Help our moderators understand the content better. This information is not displayed publicly.
                </Text>
              </div>

              <Form.Item
                label={
                  <Space>
                    <span>Description</span>
                    <Tooltip title="Provide context to help moderators review this content faster">
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  </Space>
                }
                name="description"
              >
                <Input.TextArea
                  rows={6}
                  placeholder="Example: This post contains explicit hate speech targeting Muslims, uses dehumanizing language, and has been shared over 10,000 times..."
                  maxLength={1000}
                  showCount
                />
              </Form.Item>

              {/* Privacy Notice as Tooltip-friendly Info */}
              <Card size="small" style={{ background: '#f0f5ff', border: '1px solid #d6e4ff' }}>
                <Space>
                  <SafetyOutlined style={{ color: '#1890ff', fontSize: 20 }} />
                  <div>
                    <Text strong style={{ color: '#1890ff' }}>Privacy & GDPR Compliant</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      We only collect: content URL, platform, country, language, and content type.
                      No personal data, usernames, or screenshots are stored. IP addresses are hashed for rate limiting only.
                    </Text>
                  </div>
                </Space>
              </Card>

              <Divider />

              <Row gutter={16}>
                <Col span={12}>
                  <Button size="large" block onClick={prevStep}>
                    Back
                  </Button>
                </Col>
                <Col span={12}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    htmlType="submit"
                    loading={loading}
                    icon={<SendOutlined />}
                  >
                    Submit Report
                  </Button>
                </Col>
              </Row>
            </Space>
          )}
        </Form>
      </Card>

      {/* Help Text */}
      <Card style={{ marginTop: 24, background: '#fafafa' }} bordered={false}>
        <Row gutter={[24, 16]}>
          <Col xs={24} md={8}>
            <Space direction="vertical" size="small">
              <Text strong>📊 Transparency</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Approved reports are displayed publicly on our dashboard for accountability
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size="small">
              <Text strong>🔒 Privacy First</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                We never store personal information, usernames, or screenshots
              </Text>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Space direction="vertical" size="small">
              <Text strong>⚡ Fast Review</Text>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Reports are typically reviewed within 24-48 hours
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
