import React from "react";
import { Card, Typography, Space } from "antd";

const { Title, Paragraph } = Typography;

export const About = () => {
  return (
    <div style={{ padding: "24px", maxWidth: "900px", margin: "0 auto" }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={2}>About Bright Pearl</Title>
            <Paragraph>
              Bright Pearl is a global platform to collect, verify, publish, and monitor
              islamophobic content across social platforms — enabling mass reporting,
              public transparency, and data for researchers, journalists, and activists.
            </Paragraph>
          </div>

          <div>
            <Title level={3}>Our Mission</Title>
            <Paragraph>
              We believe in creating a safer internet by:
            </Paragraph>
            <ul>
              <li>Making mass reporting easy and evidence-based</li>
              <li>Providing a single transparent source of truth about islamophobic content prevalence</li>
              <li>Protecting submitters and moderators through privacy-by-design</li>
              <li>Providing usable data exports for researchers while preserving privacy</li>
            </ul>
          </div>

          <div>
            <Title level={3}>How It Works</Title>
            <Paragraph>
              <strong>1. Submit:</strong> Anyone can submit suspected islamophobic content with
              evidence (screenshots, links, descriptions).
            </Paragraph>
            <Paragraph>
              <strong>2. Review:</strong> Our team of trained moderators reviews each submission
              to verify it meets our content policy.
            </Paragraph>
            <Paragraph>
              <strong>3. Publish:</strong> Approved reports appear on our public dashboard where
              activists can coordinate mass reporting efforts.
            </Paragraph>
            <Paragraph>
              <strong>4. Monitor:</strong> We track whether platforms take action on reported
              content and publish transparency metrics.
            </Paragraph>
          </div>

          <div>
            <Title level={3}>Privacy & Safety</Title>
            <Paragraph>
              We take privacy seriously:
            </Paragraph>
            <ul>
              <li>Minimal personal information collection (email is optional)</li>
              <li>IP addresses are hashed for abuse prevention only</li>
              <li>Moderators work through secure, invite-only access</li>
              <li>All data handling complies with privacy regulations</li>
            </ul>
          </div>

          <div>
            <Title level={3}>For Researchers</Title>
            <Paragraph>
              Bright Pearl provides valuable data for academic research, journalism, and
              advocacy work. Contact us for data exports and partnership opportunities.
            </Paragraph>
          </div>

          <div>
            <Title level={3}>Contact & Support</Title>
            <Paragraph>
              For questions, partnership inquiries, or to become a moderator, please
              reach out to us at: <a href="mailto:contact@brightpearl.org">contact@brightpearl.org</a>
            </Paragraph>
          </div>
        </Space>
      </Card>
    </div>
  );
};
