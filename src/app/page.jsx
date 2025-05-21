"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [emails, setEmails] = useState([]);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isHtml, setIsHtml] = useState(false);
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [upload, { loading: uploading }] = useUpload();
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".txt")) {
      setError("Please upload a .txt file");
      return;
    }

    const { url, error } = await upload({ file });
    if (error) {
      setError("Error uploading file");
      return;
    }

    try {
      const response = await fetch(url);
      const text = await response.text();
      const emailList = text
        .split("\n")
        .map((email) => email.trim())
        .filter((email) => email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));

      if (emailList.length === 0) {
        setError("No valid emails found in file");
        return;
      }

      setEmails(emailList);
      setSuccess(`Successfully loaded ${emailList.length} email addresses`);
      setError("");
    } catch (err) {
      setError("Error processing email list");
    }
  };

  const handleSend = async () => {
    if (!emails.length || !subject || !content) {
      setError("Please fill in all fields");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");
    setProgress(0);

    const batchSize = 50;
    const totalBatches = Math.ceil(emails.length / batchSize);

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      try {
        const response = await fetch("/api/resend-api-function", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: batch,
            subject,
            html: isHtml ? content : null,
            text: !isHtml ? content : null,
          }),
        });

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        const progress = Math.min(((i + batchSize) / emails.length) * 100, 100);
        setProgress(progress);
      } catch (err) {
        setError(
          `Failed to send batch ${
            Math.floor(i / batchSize) + 1
          }/${totalBatches}`
        );
        setSending(false);
        return;
      }
    }

    setSuccess("All emails sent successfully!");
    setProgress(100);
    setSending(false);
    setEmails([]);
    setSubject("");
    setContent("");
    setProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 font-montserrat">
            Marketing Email Sender
          </h1>
          <p className="mt-2 text-lg text-gray-600 font-roboto">
            Create and send professional email campaigns with ease
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Progress bar */}
          {sending && (
            <div className="w-full bg-gray-200 h-2">
              <div
                className="bg-blue-600 h-2 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          <div className="p-8 space-y-6">
            {/* File Upload Section */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <label className="block text-lg font-medium text-gray-700 mb-4 font-roboto">
                Upload Email List
                <span className="text-sm text-gray-500 ml-2">
                  (.txt file, one email per line)
                </span>
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                           file:rounded-full file:border-0 file:text-sm file:font-semibold
                           file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100
                           cursor-pointer"
                  disabled={sending}
                />
                {emails.length > 0 && (
                  <span className="text-sm bg-blue-50 text-blue-700 py-1 px-3 rounded-full">
                    {emails.length} emails loaded
                  </span>
                )}
              </div>
            </div>

            {/* Email Content Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-medium text-gray-700 mb-2 font-roboto">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a compelling subject line"
                  disabled={sending}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-lg font-medium text-gray-700 font-roboto">
                    Email Content
                  </label>
                  <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setIsHtml(false)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
                                ${
                                  !isHtml
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                    >
                      Plain Text
                    </button>
                    <button
                      onClick={() => setIsHtml(true)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200
                                ${
                                  isHtml
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:text-gray-900"
                                }`}
                    >
                      HTML
                    </button>
                  </div>
                </div>
                <div className="border border-gray-300 rounded-lg shadow-sm">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full px-4 py-3 min-h-[300px] rounded-lg focus:outline-none 
                             focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={
                      isHtml
                        ? "Write your email content here (HTML supported)"
                        : "Write your email content here (Plain text)"
                    }
                    disabled={sending}
                  />
                </div>
                {isHtml && (
                  <p className="mt-2 text-sm text-gray-500">
                    HTML formatting is supported (e.g., &lt;b&gt;bold&lt;/b&gt;,
                    &lt;i&gt;italic&lt;/i&gt;, &lt;a
                    href="..."&gt;links&lt;/a&gt;)
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6">
              <button
                onClick={() => setPreview(!preview)}
                className="px-6 py-2 border border-gray-300 rounded-full text-gray-700 
                         bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-blue-500 font-roboto
                         transition-colors duration-200"
                disabled={sending}
              >
                {preview ? "Hide Preview" : "Show Preview"}
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !emails.length || !subject || !content}
                className="px-8 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                         disabled:opacity-50 disabled:cursor-not-allowed font-roboto
                         transition-colors duration-200"
              >
                {sending
                  ? `Sending... ${Math.round(progress)}%`
                  : "Send Emails"}
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 font-roboto">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600 font-roboto">{success}</p>
              </div>
            )}

            {/* Preview Section */}
            {preview && (
              <div className="mt-8 border-t pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 font-roboto">
                  Email Preview
                </h2>
                <div className="border rounded-lg p-6 bg-gray-50">
                  <div className="text-sm text-gray-500 mb-4 font-roboto">
                    Subject: {subject || "No subject"}
                  </div>
                  <div className="prose max-w-none bg-white p-6 rounded-lg shadow-sm">
                    {content ? (
                      isHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                      ) : (
                        <pre className="whitespace-pre-wrap font-sans">
                          {content}
                        </pre>
                      )
                    ) : (
                      <p className="text-gray-400">No content yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainComponent;