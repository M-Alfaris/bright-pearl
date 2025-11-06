import React from "react";
import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import type { Report } from "../../types/schema";

const { TextArea } = Input;

export const ReportEdit = () => {
  const { formProps, saveButtonProps } = useForm<Report>();

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label="Platform"
          name="platform"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
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
          label="Original URL"
          name="original_url"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Title"
          name="title"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item
          label="Category"
          name="category"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={[
              { label: "Hate Speech", value: "hate_speech" },
              { label: "Harassment", value: "harassment" },
              { label: "Violence", value: "violence" },
              { label: "Discrimination", value: "discrimination" },
              { label: "Misinformation", value: "misinformation" },
              { label: "Other", value: "other" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Status"
          name="status"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={[
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Rejected", value: "rejected" },
              { label: "Published", value: "published" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Platform Status"
          name="platform_status"
        >
          <Select
            options={[
              { label: "Active", value: "active" },
              { label: "Removed", value: "removed" },
              { label: "Unknown", value: "unknown" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Language"
          name="language"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            showSearch
            options={[
              { label: "English", value: "en" },
              { label: "Arabic", value: "ar" },
              { label: "French", value: "fr" },
              { label: "German", value: "de" },
              { label: "Spanish", value: "es" },
              { label: "Urdu", value: "ur" },
              { label: "Turkish", value: "tr" },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Country"
          name="country"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            showSearch
            options={[
              { label: "United States", value: "US" },
              { label: "United Kingdom", value: "GB" },
              { label: "France", value: "FR" },
              { label: "Germany", value: "DE" },
            ]}
          />
        </Form.Item>
      </Form>
    </Edit>
  );
};
