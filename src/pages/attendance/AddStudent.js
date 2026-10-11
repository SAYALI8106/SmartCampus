import React, { useState, useEffect, useCallback } from "react";
import { Col, Row, Form, Input, Button, notification, Table, Tag, Popconfirm } from "antd";
import classes from "./index.module.scss";
import db from "../../firebase";
import { STUDENTS } from "../../utils/constants";

const AddStudent = ({ docID }) => {
  const [loading, setLoading] = useState(false);
  const [studentList, setStudentList] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const formRef = React.useRef(null);

  const targetDocID = docID || "demo_teacher_sggs";

  // Fetch registered students from Firestore
  const fetchStudents = useCallback(() => {
    setTableLoading(true);
    db.collection("users")
      .doc(targetDocID)
      .collection("students")
      .get()
      .then((querySnapshot) => {
        const list = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        list.sort((a, b) => Number(a.rollno) - Number(b.rollno));
        setStudentList(list);
      })
      .catch((error) => {
        console.error("Error fetching students:", error);
      })
      .finally(() => {
        setTableLoading(false);
      });
  }, [targetDocID]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Submit new student
  const onFinish = async (values) => {
    setLoading(true);
    try {
      await db
        .collection("users")
        .doc(targetDocID)
        .collection("students")
        .add({
          rollno: Number(values.roll_no) || values.roll_no,
          name: values.name.trim(),
          branch: values.branch.trim().toUpperCase(),
          date: new Date().toLocaleString(),
        });

      notification.success({
        message: "Student Added Successfully",
        description: `${values.name} (Roll No: ${values.roll_no}) added to branch ${values.branch}.`,
      });

      formRef.current?.resetFields();
      fetchStudents();
    } catch (error) {
      console.error("Error adding student: ", error);
      notification.error({
        message: "Failed to Add Student",
        description: error.message || "Please check Firestore connection.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Quick Load Default Batch (SGGS Hackathon Team Students)
  const handleLoadSampleBatch = async () => {
    setTableLoading(true);
    try {
      const batchRef = db.collection("users").doc(targetDocID).collection("students");
      for (const student of STUDENTS) {
        await batchRef.add({
          rollno: student.rollno,
          name: student.name,
          branch: student.branch,
          date: new Date().toLocaleString(),
        });
      }
      notification.success({
        message: "Batch Loaded",
        description: `Loaded ${STUDENTS.length} sample students (SGGS Hackathon CSE Batch).`,
      });
      fetchStudents();
    } catch (err) {
      console.error("Error loading sample students:", err);
      notification.error({
        message: "Batch Load Failed",
        description: err.message,
      });
    } finally {
      setTableLoading(false);
    }
  };

  // Delete student
  const handleDeleteStudent = async (id) => {
    try {
      await db.collection("users").doc(targetDocID).collection("students").doc(id).delete();
      notification.success({ message: "Student removed" });
      fetchStudents();
    } catch (err) {
      notification.error({ message: "Failed to delete student" });
    }
  };

  const columns = [
    {
      title: "Roll No",
      dataIndex: "rollno",
      key: "rollno",
      width: 90,
      sorter: (a, b) => Number(a.rollno) - Number(b.rollno),
    },
    {
      title: "Student Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
      render: (branch) => <Tag color="blue">{branch}</Tag>,
    },
    {
      title: "Registered At",
      dataIndex: "date",
      key: "date",
      responsive: ["md"],
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Remove student?"
          onConfirm={() => handleDeleteStudent(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="link" danger size="small">
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Row style={{ padding: "0.5rem 0.2rem" }} gutter={[12, 16]}>
      <Col span={24} className={classes.createFormContainer}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "1rem",
            gap: "0.5rem",
          }}
        >
          <h3 style={{ margin: 0, color: "var(--sub-primary-color)" }}>
            Register New Student
          </h3>
          <Button
            onClick={handleLoadSampleBatch}
            style={{
              borderColor: "var(--primary-color)",
              color: "var(--primary-color)",
              background: "transparent",
            }}
          >
            + Load SGGS Demo Batch (5 Students)
          </Button>
        </div>

        <Form
          name="basic"
          layout="vertical"
          ref={formRef}
          onFinish={onFinish}
          autoComplete="off"
        >
          <Row gutter={[20]}>
            <Col span={12} md={12} sm={24} xs={24}>
              <Form.Item
                label="Roll No"
                name="roll_no"
                rules={[
                  {
                    required: true,
                    message: "Please input student's roll no!",
                  },
                ]}
              >
                <Input placeholder="e.g. 1, 2, 3..." />
              </Form.Item>
            </Col>

            <Col span={12} md={12} sm={24} xs={24}>
              <Form.Item
                label="Student Name"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Please input student name!",
                  },
                ]}
              >
                <Input placeholder="e.g. Shubham Vyavhare" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[20]}>
            <Col span={12} md={12} sm={24} xs={24}>
              <Form.Item
                label="Branch Name"
                name="branch"
                rules={[
                  {
                    required: true,
                    message: "Please input branch name!",
                  },
                ]}
              >
                <Input placeholder="e.g. CSE, IT, ECE" />
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
              <Button
                loading={loading}
                type="primary"
                htmlType="submit"
                style={{ minWidth: "120px" }}
              >
                Add Student
              </Button>
            </Col>
          </Row>
        </Form>
      </Col>

      {/* Table of Registered Students */}
      <Col span={24} className={classes.createFormContainer}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "0.8rem",
          }}
        >
          <h4 style={{ margin: 0, color: "var(--sub-primary-color)" }}>
            Registered Students ({studentList.length})
          </h4>
          <Button size="small" onClick={fetchStudents}>
            Refresh List
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={studentList}
          rowKey="id"
          loading={tableLoading}
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </Col>
    </Row>
  );
};

export default AddStudent;
