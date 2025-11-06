import React from "react";
import { Card, Typography, Space, Divider } from "antd";

const { Title, Paragraph } = Typography;

export const Policies = () => {
  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={2}>Content & Moderation Policies</Title>
            <Paragraph>
              Last updated: {new Date().toLocaleDateString()}
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={3}>What We Consider Islamophobic Content</Title>
            <Paragraph>
              Bright Pearl accepts reports of content that:
            </Paragraph>
            <ul>
              <li>Promotes hatred, violence, or discrimination against Muslims</li>
              <li>Uses dehumanizing language or stereotypes about Islam or Muslims</li>
              <li>Spreads harmful misinformation designed to incite fear or hatred</li>
              <li>Calls for exclusion, harassment, or harm of Muslims</li>
              <li>Uses islamophobic tropes or conspiracy theories</li>
            </ul>
          </div>

          <div>
            <Title level={3}>What We Don't Accept</Title>
            <Paragraph>
              Reports will be rejected if they concern:
            </Paragraph>
            <ul>
              <li>Legitimate criticism or debate about religious practices</li>
              <li>News reporting or documentation of events</li>
              <li>Academic or educational content</li>
              <li>Content that doesn't clearly violate platform policies</li>
              <li>Personal disputes unrelated to islamophobia</li>
            </ul>
          </div>

          <div>
            <Title level={3}>Moderation Process</Title>
            <Paragraph>
              <strong>Review Timeline:</strong> Reports are typically reviewed within 48-72 hours.
            </Paragraph>
            <Paragraph>
              <strong>Criteria:</strong> Moderators evaluate content based on context, intent,
              and platform policies.
            </Paragraph>
            <Paragraph>
              <strong>Appeals:</strong> If your report is rejected and you believe this was in
              error, you may submit additional context for re-review.
            </Paragraph>
          </div>

          <Divider />

          <div>
            <Title level={3}>Privacy Policy</Title>
            <Paragraph>
              <strong>Data Collection:</strong> We collect only the information necessary to
              process reports (platform, URL, description, optional email).
            </Paragraph>
            <Paragraph>
              <strong>Data Usage:</strong> Report data is used for moderation, public
              transparency, and research purposes only.
            </Paragraph>
            <Paragraph>
              <strong>Data Sharing:</strong> Approved reports are made public. Personal
              information (email, IP) is never shared publicly.
            </Paragraph>
            <Paragraph>
              <strong>Data Retention:</strong> Reports are retained indefinitely for research
              and accountability purposes. Emails are retained only if you opt-in to updates.
            </Paragraph>
          </div>

          <div>
            <Title level={3}>Terms of Use</Title>
            <Paragraph>
              By using Bright Pearl, you agree to:
            </Paragraph>
            <ul>
              <li>Submit accurate and truthful information</li>
              <li>Not abuse the reporting system with spam or false reports</li>
              <li>Respect platform policies and local laws</li>
              <li>Use the platform for its intended purpose of combating islamophobia</li>
            </ul>
          </div>

          <Divider />

          <div>
            <Title level={3}>Contact</Title>
            <Paragraph>
              For questions about our policies or to report policy violations, contact:{" "}
              <a href="mailto:policy@brightpearl.org">policy@brightpearl.org</a>
            </Paragraph>
          </div>
        </Space>
      </Card>
    </div>
  );
};
