import React, { useEffect, useState, useRef, useCallback } from "react";
import { Col, Row, Form, Input, Button, Modal, Progress, message, Tag, Space } from "antd";
import QRCode from "react-qr-code";
import classes from "./index.module.scss";
import db from "../../firebase";
import { STUDENTS } from "../../utils/constants";

const DEFAULT_INTERVAL_SECONDS = 20;

const CreateAttendance = ({ docID }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [identifier, setIdentifier] = useState("");
  const [isQRVisible, setQRVisible] = useState(false);
  const [students, setStudents] = useState([]);
  const [isAttendanceFinished, setIsAttendanceFinished] = useState(false);
  const [sessionInfo, setSessionInfo] = useState({ subject: "", branch: "" });
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_INTERVAL_SECONDS);
  const formRef = useRef(null);
  const timerRef = useRef(null);

  const targetDocID = docID || "demo_teacher_sggs";

  const nextStudent = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev + 1 >= students.length) {
        setIsAttendanceFinished(true);
        return prev;
      }
      setTimeLeft(DEFAULT_INTERVAL_SECONDS);
      return prev + 1;
    });
  }, [students.length]);

  const prevStudent = () => {
    if (currentIndex > 0) {
      setIsAttendanceFinished(false);
      setCurrentIndex((prev) => prev - 1);
      setTimeLeft(DEFAULT_INTERVAL_SECONDS);
    }
  };

  const onFinish = async (values) => {
    const today = new Date();
    const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    setIdentifier(dateStr);
    setSessionInfo({ subject: values.subject, branch: values.branch.toUpperCase() });

    try {
      // 1. Fetch students for this branch
      const userRef = db.collection("users").doc(targetDocID).collection("students");
      const querySnapshot = await userRef.get();
      let branchStudents = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          !values.branch ||
          data.branch?.toUpperCase() === values.branch.trim().toUpperCase()
        ) {
          branchStudents.push(data);
        }
      });

      // If no students in Firestore for this branch, load default constants so the demo works
      if (branchStudents.length === 0) {
        const filteredDefault = STUDENTS.filter(
          (s) => !values.branch || s.branch.toUpperCase() === values.branch.trim().toUpperCase()
        );
        branchStudents = filteredDefault.length > 0 ? filteredDefault : STUDENTS;
        message.info(
          `No registered students found for ${values.branch}. Loaded ${branchStudents.length} demo students.`
        );
      }

      branchStudents.sort((a, b) => Number(a.rollno) - Number(b.rollno));
      setStudents(branchStudents);
      setCurrentIndex(0);
      setTimeLeft(DEFAULT_INTERVAL_SECONDS);
      setIsAttendanceFinished(false);
      setIsPaused(false);

      // 2. Record attendance session in Firestore
      await db.collection("users").doc(targetDocID).collection("attendances").add({
        subject: values.subject,
        branch: values.branch.toUpperCase(),
        total_students: values.total_students || branchStudents.length,
        date: dateStr,
        createdAt: new Date().toISOString(),
      });

      setQRVisible(true);
      formRef.current?.resetFields();
    } catch (error) {
      console.error("Error creating attendance session:", error);
      message.error("Failed to initialize session: " + error.message);
    }
  };

  // Timer ticker for rolling QR code
  useEffect(() => {
    if (!isQRVisible || isAttendanceFinished || isPaused || students.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          nextStudent();
          return DEFAULT_INTERVAL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isQRVisible, isAttendanceFinished, isPaused, students.length, nextStudent]);

  const currentStudent = students[currentIndex] || {};
  const qrPayload = currentStudent.name
    ? `${currentStudent.rollno} ${currentStudent.name} ${currentStudent.branch} ${identifier}`
    : "";

  const copyPayload = () => {
    if (qrPayload) {
      navigator.clipboard?.writeText(qrPayload);
      message.success("Copied QR Code string to clipboard!");
    }
  };

  return (
    <Row style={{ padding: "0.5rem 0.2rem" }} gutter={[5]}>
      <Col span={24} className={classes.createFormContainer}>
        <div style={{ marginBottom: "1rem" }}>
          <h3 style={{ margin: 0, color: "var(--sub-primary-color)" }}>
            Create Proxy-Free Attendance Session
          </h3>
          <p style={{ margin: "0.3rem 0 0", color: "#a0a5ad", fontSize: "0.9rem" }}>
            Generates dynamic, time-limited QR codes rotating every 20 seconds for each enrolled student.
          </p>
        </div>

        <Form
          name="createAttendanceForm"
          ref={formRef}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{ branch: "CSE", total_students: "5" }}
        >
          <Row gutter={[20]}>
            <Col span={12} md={12} sm={24} xs={24}>
              <Form.Item
                label="Subject Name"
                name="subject"
                rules={[{ required: true, message: "Please input subject name!" }]}
              >
                <Input placeholder="e.g. Operating Systems, Cloud Computing" />
              </Form.Item>
            </Col>

            <Col span={12} md={12} sm={24} xs={24}>
              <Form.Item
                label="Branch Name"
                name="branch"
                rules={[{ required: true, message: "Please input branch name!" }]}
              >
                <Input placeholder="e.g. CSE, IT" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[20]}>
            <Col span={12} md={12} sm={24} xs={24}>
              <Form.Item
                label="Total Expected Students"
                name="total_students"
                rules={[{ required: true, message: "Please enter total students!" }]}
              >
                <Input type="number" placeholder="e.g. 5 or 60" />
              </Form.Item>
            </Col>

            <Col
              span={12}
              md={12}
              sm={24}
              xs={24}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                marginTop: "1.5rem",
              }}
            >
              <Button type="primary" htmlType="submit" size="large">
                Start QR Attendance
              </Button>
            </Col>
          </Row>
        </Form>
      </Col>

      {/* QR Code Presentation Modal */}
      <Modal
        open={isQRVisible}
        footer={null}
        centered
        destroyOnClose
        className={classes.qrModal}
        styles={{
          body: {
            backgroundColor: "#222831",
            padding: "1.5rem",
            borderRadius: "8px",
            color: "#eeeeee",
          },
        }}
        onCancel={() => setQRVisible(false)}
        width={480}
      >
        <div style={{ textAlign: "center" }}>
          {isAttendanceFinished ? (
            <div style={{ padding: "2rem 0" }}>
              <h2 style={{ color: "var(--primary-color)", marginBottom: "0.5rem" }}>
                Attendance Session Finished!
              </h2>
              <p style={{ color: "#a0a5ad" }}>
                All {students.length} students have rotated through the proxy-free session.
              </p>
              <Button
                type="primary"
                size="large"
                style={{ marginTop: "1rem" }}
                onClick={() => setQRVisible(false)}
              >
                Done / Close Session
              </Button>
            </div>
          ) : (
            <div>
              {/* Session Header */}
              <div style={{ marginBottom: "1rem" }}>
                <Tag color="#00adb5" style={{ fontSize: "0.85rem", padding: "2px 8px" }}>
                  {sessionInfo.subject} · {sessionInfo.branch}
                </Tag>
                <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "#a0a5ad" }}>
                  Student {currentIndex + 1} of {students.length}
                </p>
              </div>

              {/* QR Code Graphic */}
              <div
                style={{
                  background: "#ffffff",
                  padding: "1rem",
                  borderRadius: "8px",
                  display: "inline-block",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
                }}
              >
                {qrPayload ? (
                  <QRCode
                    title={currentStudent.name}
                    value={qrPayload}
                    size={220}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                ) : (
                  <p style={{ color: "#000" }}>No QR Available</p>
                )}
              </div>

              {/* Student Identity */}
              <div style={{ marginTop: "1rem" }}>
                <h3 style={{ color: "var(--primary-color)", margin: "0.2rem 0" }}>
                  Roll #{currentStudent.rollno}: {currentStudent.name}
                </h3>
                <p style={{ color: "#a0a5ad", margin: 0, fontSize: "0.85rem" }}>
                  Payload: <code>{qrPayload}</code>
                </p>
              </div>

              {/* Progress & Countdown Bar */}
              <div style={{ marginTop: "1rem", padding: "0 1.5rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                    color: "#a0a5ad",
                    marginBottom: "4px",
                  }}
                >
                  <span>{isPaused ? "Timer Paused" : `Next student in: ${timeLeft}s`}</span>
                  <span>{Math.round(((currentIndex + 1) / students.length) * 100)}%</span>
                </div>
                <Progress
                  percent={Math.round((timeLeft / DEFAULT_INTERVAL_SECONDS) * 100)}
                  showInfo={false}
                  strokeColor="var(--primary-color)"
                  trailColor="#393e46"
                />
              </div>

              {/* Interactive Controller Buttons */}
              <div style={{ marginTop: "1.2rem" }}>
                <Space wrap style={{ justifyContent: "center" }}>
                  <Button size="small" onClick={prevStudent} disabled={currentIndex === 0}>
                    &lt; Previous
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setIsPaused((prev) => !prev)}
                    style={{ minWidth: "75px" }}
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button size="small" type="primary" onClick={nextStudent}>
                    Next Student &gt;
                  </Button>
                  <Button size="small" onClick={copyPayload}>
                    Copy QR Data
                  </Button>
                </Space>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Row>
  );
};

export default CreateAttendance;
