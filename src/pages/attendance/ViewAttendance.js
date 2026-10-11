import React, { useEffect, useState } from "react";
import db from "../../firebase";
import { Table, Row, Col, Button, Tag, Card, Statistic, Space, Popconfirm, message } from "antd";
import { ReloadOutlined, DeleteOutlined, CheckCircleOutlined } from "@ant-design/icons";

const parseStudentDetails = (rawStr) => {
  if (!rawStr) return { rollno: "-", name: "-", branch: "-", date: "-", raw: "" };

  const parts = rawStr.trim().split(/\s+/);
  if (parts.length >= 4) {
    const rollno = parts[0];
    const date = parts[parts.length - 1];
    const branch = parts[parts.length - 2];
    const name = parts.slice(1, parts.length - 2).join(" ");
    return { rollno, name, branch, date, raw: rawStr };
  } else if (parts.length === 3) {
    return { rollno: parts[0], name: parts[1], branch: parts[2], date: "-", raw: rawStr };
  }
  return { rollno: "-", name: rawStr, branch: "-", date: "-", raw: rawStr };
};

const ViewAttendance = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = () => {
    setLoading(true);
    db.collection("attendance")
      .get()
      .then((querySnapshot) => {
        const list = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          const parsed = parseStudentDetails(docData.studentdetails);
          list.push({
            id: doc.id,
            key: doc.id,
            ...docData,
            ...parsed,
          });
        });
        // Sort newest first
        list.reverse();
        setTableData(list);
      })
      .catch((error) => {
        console.error("Error getting attendance records:", error);
        message.error("Failed to load records: " + error.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteRecord = async (id) => {
    try {
      await db.collection("attendance").doc(id).delete();
      message.success("Attendance entry deleted");
      fetchData();
    } catch (err) {
      message.error("Error deleting entry: " + err.message);
    }
  };

  const handleClearAll = async () => {
    try {
      const snapshot = await db.collection("attendance").get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      message.success("All attendance records cleared");
      fetchData();
    } catch (err) {
      message.error("Error clearing records: " + err.message);
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
      render: (name) => <strong style={{ color: "var(--sub-primary-color)" }}>{name}</strong>,
    },
    {
      title: "Branch",
      dataIndex: "branch",
      key: "branch",
      render: (branch) => <Tag color="cyan">{branch || "N/A"}</Tag>,
    },
    {
      title: "Status",
      key: "status",
      render: () => (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Present
        </Tag>
      ),
    },
    {
      title: "Session Date",
      dataIndex: "date",
      key: "date",
      responsive: ["md"],
    },
    {
      title: "Recorded Time",
      dataIndex: "recordedAt",
      key: "recordedAt",
      render: (time) => time || "Just now",
      responsive: ["lg"],
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Delete entry?"
          onConfirm={() => handleDeleteRecord(record.id)}
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
    <div style={{ marginTop: "1rem" }}>
      {/* Top Stat Bar */}
      <Row gutter={[16, 16]} style={{ marginBottom: "1rem" }}>
        <Col span={8} xs={24} sm={8}>
          <Card
            style={{ backgroundColor: "var(--theme-color)", borderColor: "#393e46" }}
          >
            <Statistic
              title={<span style={{ color: "#a0a5ad" }}>Total Present</span>}
              value={tableData.length}
              valueStyle={{ color: "var(--primary-color)" }}
            />
          </Card>
        </Col>
        <Col span={8} xs={12} sm={8}>
          <Card
            style={{ backgroundColor: "var(--theme-color)", borderColor: "#393e46" }}
          >
            <Statistic
              title={<span style={{ color: "#a0a5ad" }}>Branches Recorded</span>}
              value={new Set(tableData.map((d) => d.branch).filter(Boolean)).size}
              valueStyle={{ color: "var(--sub-primary-color)" }}
            />
          </Card>
        </Col>
        <Col span={8} xs={12} sm={8}>
          <Card
            style={{ backgroundColor: "var(--theme-color)", borderColor: "#393e46" }}
          >
            <Statistic
              title={<span style={{ color: "#a0a5ad" }}>System Status</span>}
              value="Proxy Free Active"
              valueStyle={{ color: "#52c41a", fontSize: "1.1rem" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Header and Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <h3 style={{ margin: 0, color: "var(--sub-primary-color)" }}>
          Attendance Live Log
        </h3>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>
            Refresh
          </Button>
          {tableData.length > 0 && (
            <Popconfirm
              title="Clear all attendance logs?"
              description="This will permanently delete all recorded attendance records in Firestore."
              onConfirm={handleClearAll}
              okText="Yes, Clear All"
              cancelText="Cancel"
            >
              <Button icon={<DeleteOutlined />} danger>
                Clear Log
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {/* Table */}
      <Table
        style={{ width: "100%" }}
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
        scroll={{ x: 600 }}
      />
    </div>
  );
};

export default ViewAttendance;
