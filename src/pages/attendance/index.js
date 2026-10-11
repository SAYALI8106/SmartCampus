import { Row, Col, Tabs } from "antd";
import React from "react";
import Student from "./Student";
import Teacher from "./Teacher";
import classes from "./index.module.scss";
import { UserOutlined, SolutionOutlined } from "@ant-design/icons";

const Attendance = () => {
  const items = [
    {
      key: "teacher",
      label: (
        <span>
          <SolutionOutlined /> Teacher Portal
        </span>
      ),
      children: <Teacher />,
    },
    {
      key: "student",
      label: (
        <span>
          <UserOutlined /> Student Portal
        </span>
      ),
      children: <Student />,
    },
  ];

  return (
    <div className="container" style={{ minHeight: "82vh", paddingBottom: "2rem" }}>
      <Row>
        <Col span={24} className={classes.tabsContainer}>
          <Tabs
            defaultActiveKey="teacher"
            items={items}
            className={classes.attendanceTabs}
          />
        </Col>
      </Row>
    </div>
  );
};

export default Attendance;
