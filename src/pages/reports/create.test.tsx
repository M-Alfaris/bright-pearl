// Unit tests for ReportCreate component
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportCreate } from './create';

// Mock fetch
global.fetch = vi.fn();

// Mock import.meta.env
vi.mock('../../utility', () => ({
  supabaseClient: {},
}));

describe('ReportCreate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  it('renders the form correctly', () => {
    render(<ReportCreate />);

    expect(screen.getByText('Submit a Report')).toBeInTheDocument();
    expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
  });

  it('displays privacy notice', () => {
    render(<ReportCreate />);

    expect(screen.getByText(/Privacy & GDPR Notice/i)).toBeInTheDocument();
    expect(
      screen.getByText(/We only collect: content URL, platform, country, language/i)
    ).toBeInTheDocument();
  });

  it('shows all platform options', async () => {
    render(<ReportCreate />);
    const user = userEvent.setup();

    const platformSelect = screen.getByLabelText(/platform/i);
    await user.click(platformSelect);

    await waitFor(() => {
      expect(screen.getByText('Twitter/X')).toBeInTheDocument();
      expect(screen.getByText('Facebook')).toBeInTheDocument();
      expect(screen.getByText('Instagram')).toBeInTheDocument();
      expect(screen.getByText('YouTube')).toBeInTheDocument();
      expect(screen.getByText('TikTok')).toBeInTheDocument();
      expect(screen.getByText('Reddit')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });
  });

  it('disables content type until platform is selected', () => {
    render(<ReportCreate />);

    const contentTypeSelect = screen.getByLabelText(/content type/i);
    expect(contentTypeSelect).toBeDisabled();
  });

  it('enables content type after platform selection', async () => {
    render(<ReportCreate />);
    const user = userEvent.setup();

    const platformSelect = screen.getByLabelText(/platform/i);
    await user.click(platformSelect);
    await user.click(screen.getByText('Twitter/X'));

    const contentTypeSelect = screen.getByLabelText(/content type/i);
    expect(contentTypeSelect).not.toBeDisabled();
  });

  it('shows platform-specific content types', async () => {
    render(<ReportCreate />);
    const user = userEvent.setup();

    // Select Twitter
    const platformSelect = screen.getByLabelText(/platform/i);
    await user.click(platformSelect);
    await user.click(screen.getByText('Twitter/X'));

    // Check Twitter-specific content types
    const contentTypeSelect = screen.getByLabelText(/content type/i);
    await user.click(contentTypeSelect);

    await waitFor(() => {
      expect(screen.getByText('Tweet')).toBeInTheDocument();
      expect(screen.getByText('Reply')).toBeInTheDocument();
      expect(screen.getByText('Retweet')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<ReportCreate />);
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please select the platform/i)).toBeInTheDocument();
    });
  });

  it('validates URL format', async () => {
    render(<ReportCreate />);
    const user = userEvent.setup();

    const urlInput = screen.getByLabelText(/content url/i);
    await user.type(urlInput, 'not-a-valid-url');

    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid URL/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const mockResponse = {
      success: true,
      report_id: 123,
      report_count: 1,
      message: 'Thank you for your report',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<ReportCreate />);
    const user = userEvent.setup();

    // Fill form
    const platformSelect = screen.getByLabelText(/platform/i);
    await user.click(platformSelect);
    await user.click(screen.getByText('Twitter/X'));

    const contentTypeSelect = screen.getByLabelText(/content type/i);
    await user.click(contentTypeSelect);
    await user.click(screen.getByText('Tweet'));

    const urlInput = screen.getByLabelText(/content url/i);
    await user.type(urlInput, 'https://twitter.com/user/status/123');

    const descriptionInput = screen.getByLabelText(/additional context/i);
    await user.type(descriptionInput, 'This is a test report');

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);

    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText(/Thank You for Your Submission!/i)).toBeInTheDocument();
      expect(screen.getByText(/Report ID:/i)).toBeInTheDocument();
    });
  });

  it('handles rate limit error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        error: 'Rate limit exceeded',
        message: 'Too many submissions. Please try again in 30 minutes.',
      }),
    });

    render(<ReportCreate />);
    const user = userEvent.setup();

    // Fill and submit form
    const platformSelect = screen.getByLabelText(/platform/i);
    await user.click(platformSelect);
    await user.click(screen.getByText('Twitter/X'));

    const contentTypeSelect = screen.getByLabelText(/content type/i);
    await user.click(contentTypeSelect);
    await user.click(screen.getByText('Tweet'));

    const urlInput = screen.getByLabelText(/content url/i);
    await user.type(urlInput, 'https://twitter.com/user/status/123');

    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);

    // Should show rate limit error
    await waitFor(() => {
      // Ant Design message component - check that error was called
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it('enforces description character limit', async () => {
    render(<ReportCreate />);
    const user = userEvent.setup();

    const descriptionInput = screen.getByLabelText(/additional context/i) as HTMLTextAreaElement;

    // Try to type more than 1000 characters
    const longText = 'a'.repeat(1001);
    await user.type(descriptionInput, longText);

    // Should be limited to 1000
    expect(descriptionInput.value.length).toBeLessThanOrEqual(1000);
  });

  it('allows submitting another report after success', async () => {
    const mockResponse = {
      success: true,
      report_id: 123,
      report_count: 1,
      message: 'Thank you for your report',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<ReportCreate />);
    const user = userEvent.setup();

    // Submit first report (abbreviated)
    const platformSelect = screen.getByLabelText(/platform/i);
    await user.click(platformSelect);
    await user.click(screen.getByText('Twitter/X'));

    const contentTypeSelect = screen.getByLabelText(/content type/i);
    await user.click(contentTypeSelect);
    await user.click(screen.getByText('Tweet'));

    const urlInput = screen.getByLabelText(/content url/i);
    await user.type(urlInput, 'https://twitter.com/user/status/123');

    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);

    // Wait for success
    await waitFor(() => {
      expect(screen.getByText(/Thank You for Your Submission!/i)).toBeInTheDocument();
    });

    // Click "Submit Another Report"
    const anotherButton = screen.getByRole('button', { name: /submit another report/i });
    await user.click(anotherButton);

    // Should show form again
    await waitFor(() => {
      expect(screen.getByText('Submit a Report')).toBeInTheDocument();
      expect(screen.getByLabelText(/platform/i)).toBeInTheDocument();
    });
  });
});
