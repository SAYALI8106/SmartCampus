import React from "react";
import { Helmet } from "react-helmet";
import { Row, Col, Button, Tag, Space } from "antd";
import classes from "./Banner.module.scss";
import { useNavigate } from "react-router-dom";
import { ArrowRightOutlined, TrophyOutlined } from "@ant-design/icons";

const Banner = () => {
  const navigate = useNavigate();

  return (
    <div className={`container ${classes.banner}`}>
      <Helmet title="DigiCampus - Proxy Free Attendance" />
      <Row align="middle">
        <Col span={13} md={13} sm={24} xs={24} className={classes.info}>
          <div style={{ marginBottom: "0.8rem" }}>
            <Tag
              icon={<TrophyOutlined />}
              color="#00adb5"
              style={{ fontSize: "0.85rem", padding: "4px 10px" }}
            >
              National Level Hackathon Winner · Pragyaa SGGS
            </Tag>
          </div>
          <h2>Let's make</h2>
          <h1 className={classes.title}>Proxy Free Attendance</h1>
          <p className={classes.detail}>
            <strong>DigiCampus </strong>is an online smart attendance platform
            that empowers educational campuses to conduct 100% proxy-free,
            paperless attendance. Powered by rolling cryptographic QR code
            rotation and instant scanner verification.
          </p>
          <div>
            <Space wrap>
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={() => navigate("/pages/attendance")}
                style={{ minWidth: "180px", height: "46px" }}
              >
                Go to Attendance
              </Button>
            </Space>
          </div>
        </Col>
        <Col span={11} sm={11} xs={24} className={classes.bannerImage}>
          <img src="/images/banner.png" alt="banner illustration" />
        </Col>
      </Row>
    </div>
  );
};

export default Banner;
