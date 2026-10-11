import { Row, Col, Button, notification, Input, Card, Divider, Alert, Space } from "antd";
import React, { useState, useEffect } from "react";
import classes from "./index.module.scss";
import { QrReader } from "react-qr-reader";
import db from "../../firebase";
import { useNavigate } from "react-router-dom";
import { CheckCircleFilled, QrcodeOutlined, EditOutlined, ThunderboltOutlined } from "@ant-design/icons";

const Student = () => {
  const [data, setData] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // Handle Attendance Submission to Firestore
  const submitAttendance = async (scannedText) => {
    if (!scannedText || scannedText.trim() === "") return;
    setSubmitting(true);

    try {
      const today = new Date();
      const docRef = await db.collection("attendance").add({
        studentdetails: scannedText.trim(),
        timestamp: today.toISOString(),
        recordedAt: today.toLocaleTimeString() + " " + today.toLocaleDateString(),
      });

      console.log("Attendance recorded with doc ID:", docRef.id);
      setAttendanceSuccess(scannedText);
      setShowScanner(false);

      notification.success({
        message: "Attendance Marked Successfully!",
        description: `Verified details: ${scannedText}`,
      });
    } catch (error) {
      console.error("Attendance submission error:", error);
      notification.error({
        message: "Submission Error",
        description: error.message || "Failed to save attendance record.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger submission when data changes from camera scan
  useEffect(() => {
    if (data && data !== "") {
      submitAttendance(data);
    }
  }, [data]);

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      notification.warning({ message: "Please enter or paste QR Code text" });
      return;
    }
    submitAttendance(manualCode.trim());
  };

  const handleQuickDemoScan = (samplePayload) => {
    const payload = samplePayload || "1 Shubham Vyavhare CSE 11-10-2026";
    submitAttendance(payload);
  };

  return (
    <Row justify="center" style={{ padding: "1rem 0" }}>
      <Col span={24} md={20} lg={16}>
        {attendanceSuccess ? (
          <Card
            style={{
              backgroundColor: "var(--theme-color)",
              border: "1px solid #00adb5",
              textAlign: "center",
              padding: "2rem 1rem",
              borderRadius: "10px",
            }}
          >
            <CheckCircleFilled style={{ fontSize: "3rem", color: "#00adb5" }} />
            <h2 style={{ color: "#eeeeee", marginTop: "1rem" }}>
              Attendance Recorded Successfully!
            </h2>
            <Alert
              message="Student Verified"
              description={<code>{attendanceSuccess}</code>}
              type="success"
              showIcon
              style={{ margin: "1rem auto", maxWidth: "450px", textAlign: "left" }}
            />
            <p style={{ color: "#a0a5ad" }}>
              To prevent proxy attendance, your session is complete.
            </p>
            <Space wrap style={{ marginTop: "1rem" }}>
              <Button
                type="primary"
                onClick={() => {
                  setAttendanceSuccess(null);
                  setData("");
                  setManualCode("");
                }}
              >
                Mark Another Student
              </Button>
              <Button onClick={() => navigate("/")}>Return to Home</Button>
            </Space>
          </Card>
        ) : (
          <div className={classes.scanContainer}>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ color: "var(--sub-primary-color)", margin: 0 }}>
                Student Attendance Portal
              </h2>
              <p style={{ color: "#a0a5ad", marginTop: "0.3rem" }}>
                Scan the dynamic rolling QR code displayed on the teacher's screen to mark your attendance.
              </p>
            </div>

            {/* Option 1: Live Camera Scanner */}
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <Button
                type={showScanner ? "default" : "primary"}
                size="large"
                icon={<QrcodeOutlined />}
                onClick={() => setShowScanner((prev) => !prev)}
              >
                {showScanner ? "Close Camera Scanner" : "Launch Camera Scanner"}
              </Button>
            </div>

            {showScanner && (
              <div
                style={{
                  maxWidth: "400px",
                  margin: "0 auto 1.5rem",
                  padding: "1rem",
                  background: "#222831",
                  borderRadius: "8px",
                }}
              >
                <QrReader
                  constraints={{ facingMode: "environment" }}
                  onResult={(result, error) => {
                    if (result?.text) {
                      setData(result.text);
                    }
                  }}
                  style={{ width: "100%" }}
                />
                <p style={{ textAlign: "center", color: "#a0a5ad", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  Point your camera at the teacher's rolling QR code
                </p>
              </div>
            )}

            <Divider style={{ borderColor: "#4b5058", color: "#a0a5ad" }}>
              OR MANUALLY ENTER QR CODE
            </Divider>

            {/* Option 2: Manual Code Input (Perfect for desktop testing without webcam) */}
            <div
              style={{
                background: "#222831",
                padding: "1.2rem",
                borderRadius: "8px",
                marginBottom: "1rem",
              }}
            >
              <p style={{ color: "#eeeeee", marginBottom: "0.5rem" }}>
                <EditOutlined /> Paste / Enter QR Code Data:
              </p>
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  placeholder="e.g. 1 Shubham Vyavhare CSE 11-10-2026"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onPressEnter={handleManualSubmit}
                />
                <Button
                  type="primary"
                  loading={submitting}
                  onClick={handleManualSubmit}
                >
                  Submit
                </Button>
              </Space.Compact>
            </div>

            {/* Option 3: Quick Demo Simulation */}
            <div
              style={{
                background: "#2a2f38",
                padding: "1rem",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <p style={{ color: "#a0a5ad", margin: "0 0 0.6rem", fontSize: "0.85rem" }}>
                <ThunderboltOutlined /> Quick Evaluation Simulator (Click to test instantly):
              </p>
              <Space wrap style={{ justifyContent: "center" }}>
                <Button
                  size="small"
                  onClick={() => handleQuickDemoScan("1 Shubham Vyavhare CSE 11-10-2026")}
                >
                  Mark Shubham (Roll 1)
                </Button>
                <Button
                  size="small"
                  onClick={() => handleQuickDemoScan("2 Pawan Shahane CSE 11-10-2026")}
                >
                  Mark Pawan (Roll 2)
                </Button>
                <Button
                  size="small"
                  onClick={() => handleQuickDemoScan("3 Vaishnavi Savant CSE 11-10-2026")}
                >
                  Mark Vaishnavi (Roll 3)
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Col>
    </Row>
  );
};

export default Student;
