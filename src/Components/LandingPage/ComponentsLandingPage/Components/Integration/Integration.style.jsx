import styled from "styled-components";

const IntegrationStyleWrapper = styled.section`
  padding-top: 132px;
  padding-bottom: 140px;
  position: relative;
  &.newsletter {
    padding-top: 100px;
    .index2-integration-auto-slider {
      &:before {
        background: linear-gradient(
          90deg,
          #eef2f5 22.92%,
          rgba(236, 239, 241, 0) 100%
        );
      }

      &:after {
        background: linear-gradient(
          90deg,
          rgba(236, 239, 241, 0) 0%,
          #eef2f5 76.56%
        );
      }
    }
  }
  & .index2-integration-bg img {
    position: absolute;
    bottom: 0px;
    left: 0px;
    width: 100%;
    min-height: 1100px;
    z-index: 0;
  }
  & .index2-integration-content {
    position: relative;
    z-index: 2;
    overflow-x: hidden;
  }
  .index2-integration-auto-slider {
    margin-top: 38px;
    position: relative;
    &:before {
      content: "";
      background: linear-gradient(
        90deg,
        #eceff1 22.92%,
        rgba(236, 239, 241, 0) 100%
      );
      height: 100%;
      width: 362px;
      left: 0px;
      bottom: 0px;
      position: absolute;
      z-index: 1;
    }
    &:after {
      content: "";
      background: linear-gradient(
        90deg,
        rgba(236, 239, 241, 0) 0%,
        #eceff1 76.56%
      );
      height: 100%;
      width: 362px;
      right: 0px;
      bottom: 0px;
      position: absolute;
      z-index: 1;
    }
  }
  .index2-integration-auto-slider-list {
    position: relative;
    z-index: 0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    & ul {
      padding: 0;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: smoothSlider 17s infinite linear;
      & li {
        min-height: 100px;
        min-width: 100px;
        text-align: center;
        margin-right: 94px;
      }
    }
  }

  @media screen and (max-width: 1199px) {
    .index2-integration-auto-slider-list ul li {
      height: 80px;
      width: 80px;
    }
    .index2-integration-auto-slider-list ul li {
      height: 80px;
      width: 80px;
    }
  }
  @media screen and (max-width: 991px) {
    .index2-integration-auto-slider:after,
    .index2-integration-auto-slider:before {
      width: 200px;
    }
    .index2-integration-auto-slider-list {
      gap: 50px;
    }
    .index2-integration-auto-slider-list ul {
      gap: 50px;
    }
    .index2-integration-auto-slider-list ul li {
      height: 60px;
      width: 60px;
    }
    .index2-integration-auto-slider:after,
    .index2-integration-auto-slider:before {
      width: 200px;
    }
    .index2-integration-auto-slider-list {
      gap: 50px;
    }
    .index2-integration-auto-slider-list ul {
      gap: 50px;
    }
    .index2-integration-auto-slider-list ul li {
      height: 60px;
      width: 60px;
      min-height: 60px;
      min-width: 60px;
      margin-right: 54px;
    }
  }
  @media screen and (max-width: 767px) {
    padding: 80px 0px;
    &.newsletter {
      padding-top: 45px;
    }
  }
`;

export default IntegrationStyleWrapper;
