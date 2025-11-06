import React from "react";
import { useShow } from "@refinedev/core";
import { Show, TagField, TextField, DateField } from "@refinedev/antd";
import { Typography, Space, Card, Descriptions, Tag } from "antd";
import type { Report } from "../../types/schema";

const { Title, Paragraph, Link } = Typography;

export const ReportShow = () => {
  const { query } = useShow<Report>();
  const { data, isLoading } = query;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>Report Details</Title>
      <Descriptions bordered column={2}>
        <Descriptions.Item label="ID">
          <TextField value={record?.id} />
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          {record?.status && (
            <TagField
              value={record.status}
              color={
                record.status === "approved"
                  ? "green"
                  : record.status === "rejected"
                  ? "red"
                  : record.status === "published"
                  ? "cyan"
                  : "orange"
              }
            />
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Platform">
          <TagField value={record?.platform} />
        </Descriptions.Item>
        <Descriptions.Item label="Platform Status">
          {record?.platform_status && (
            <TagField
              value={record.platform_status}
              color={
                record.platform_status === "removed"
                  ? "green"
                  : record.platform_status === "active"
                  ? "red"
                  : "gray"
              }
            />
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Category">
          <TagField value={record?.category} color="blue" />
        </Descriptions.Item>
        <Descriptions.Item label="Language">
          <TextField value={record?.language} />
        </Descriptions.Item>
        <Descriptions.Item label="Country">
          <TextField value={record?.country} />
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          <DateField value={record?.created_at} format="LLL" />
        </Descriptions.Item>
      </Descriptions>

      <Card title="Content Details" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <strong>Title:</strong>
            <Paragraph>{record?.title}</Paragraph>
          </div>
          <div>
            <strong>Description:</strong>
            <Paragraph>{record?.description}</Paragraph>
          </div>
          <div>
            <strong>Original URL:</strong>
            <Link href={record?.original_url} target="_blank">
              {record?.original_url}
            </Link>
          </div>
        </Space>
      </Card>

      {record?.moderation_notes && (
        <Card title="Moderation Notes" style={{ marginTop: 16 }}>
          <pre>{JSON.stringify(record.moderation_notes, null, 2)}</pre>
        </Card>
      )}
    </Show>
  );
};
