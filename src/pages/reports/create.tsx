import React, { useState } from "react";
import { Form, Input, Select, Button, Card, Typography, Alert, message, Space } from "antd";
import { SendOutlined } from "@ant-design/icons";
import type { Platform } from "../../types/simplified-schema";

const { Title, Paragraph, Text: AntText } = Typography;

export const ReportCreate: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
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
          message.error(data.message || 'Rate limit exceeded. Please try again later.');
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
      message.success('Report submitted successfully!');
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

  if (submitted && reportResult) {
    return (
      <div>
        <Card style={{ marginBottom: 24, textAlign: 'center' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ fontSize: 48 }}>✅</div>
            <Title level={2}>Thank You for Your Submission!</Title>
            <Alert
              message="Report Submitted Successfully"
              description={reportResult.message}
              type="success"
              showIcon
              style={{ textAlign: 'left' }}
            />
            <Card size="small" style={{ background: '#f5f5f5' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Paragraph style={{ margin: 0 }}>
                  <strong>Report ID:</strong> <Text code>#{reportResult.report_id}</Text>
                </Paragraph>
                <Paragraph style={{ margin: 0 }}>
                  <strong>Total Reports for this content:</strong> <Text type={reportResult.report_count > 10 ? 'danger' : 'secondary'}>{reportResult.report_count}</Text>
                </Paragraph>
              </Space>
            </Card>
            <Paragraph type="secondary" style={{ maxWidth: 600, margin: '0 auto' }}>
              Your report will be reviewed by our moderators. If approved, it will appear on the public dashboard.
              We typically review reports within 24-48 hours.
            </Paragraph>
            <Space size="large" wrap>
              <Button
                type="primary"
                size="large"
                onClick={() => window.location.href = '/dashboard'}
              >
                View Public Dashboard
              </Button>
              <Button
                size="large"
                onClick={() => setSubmitted(false)}
              >
                Submit Another Report
              </Button>
            </Space>
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Title level={2}>Submit a Report</Title>
        <Paragraph>
          Report islamophobic content from social media platforms. Your submission will be reviewed by our moderators.
        </Paragraph>
        <Alert
          message="Privacy & GDPR Notice"
          description="We only collect: content URL, platform, country, language, and content type. No personal data, usernames, or screenshots are stored. IP addresses are hashed for rate limiting only."
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Platform"
            name="platform"
            rules={[
              {
                required: true,
                message: "Please select the platform",
              },
            ]}
          >
            <Select
              placeholder="Select platform where the content is hosted"
              onChange={handlePlatformChange}
              options={[
                { label: "Twitter/X", value: "twitter" },
                { label: "Facebook", value: "facebook" },
                { label: "Instagram", value: "instagram" },
                { label: "YouTube", value: "youtube" },
                { label: "TikTok", value: "tiktok" },
                { label: "Reddit", value: "reddit" },
                { label: "Other", value: "other" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Content Type"
            name="content_type"
            rules={[
              {
                required: true,
                message: "Please select the content type",
              },
            ]}
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
            label="Content URL"
            name="content_link"
            rules={[
              {
                required: true,
                message: "Please enter the URL",
              },
              {
                type: "url",
                message: "Please enter a valid URL",
              },
            ]}
            help="Direct link to the content (post, video, comment, etc.)"
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item
            label="Language"
            name="language"
            rules={[
              {
                required: true,
                message: "Please select the language",
              },
            ]}
            initialValue="en"
          >
            <Select
              placeholder="Select language of the content"
              showSearch
              options={[
                { label: "English", value: "en" },
                { label: "Arabic", value: "ar" },
                { label: "French", value: "fr" },
                { label: "German", value: "de" },
                { label: "Spanish", value: "es" },
                { label: "Urdu", value: "ur" },
                { label: "Turkish", value: "tr" },
                { label: "Hindi", value: "hi" },
                { label: "Other", value: "other" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Country"
            name="country"
            rules={[
              {
                required: true,
                message: "Please select the country",
              },
            ]}
            initialValue="US"
          >
            <Select
              placeholder="Select country where content originates"
              showSearch
              options={[
                { label: "United States", value: "US" },
                { label: "United Kingdom", value: "GB" },
                { label: "France", value: "FR" },
                { label: "Germany", value: "DE" },
                { label: "India", value: "IN" },
                { label: "Pakistan", value: "PK" },
                { label: "Turkey", value: "TR" },
                { label: "Saudi Arabia", value: "SA" },
                { label: "United Arab Emirates", value: "AE" },
                { label: "Canada", value: "CA" },
                { label: "Australia", value: "AU" },
                { label: "Other", value: "OT" },
              ]}
            />
          </Form.Item>

          <Form.Item
            label="Additional Context (Optional)"
            name="description"
            help="Provide additional context to help our moderators review this report faster. This information is not displayed publicly."
          >
            <Input.TextArea
              rows={4}
              placeholder="Example: This post contains explicit hate speech targeting Muslims, uses dehumanizing language, and has been shared over 10,000 times..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SendOutlined />}
              size="large"
              block
            >
              Submit Report
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
