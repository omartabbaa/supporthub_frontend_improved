import styled from "styled-components";

const BrandSliderStyleWrapper = styled.section`
  /*-- brands-section start --*/
  padding: 93px 0 0 0;
  .container {
    position: relative;
  }
  &.newslater {
    padding: 60px 20px;
    .brands-section-title {
      background: #eef2f5;
    }
  }
  &.corporate-brands-section {
    padding: 128px 0px 124px 0px;
    .brands-slider {
      display: flex;
      align-items: center;
    }
  }

  /*-- brands-section-title style --*/
  .brands-section-title {
    margin-bottom: 25px;
    text-align: center;
    &.brands-section-title-index2 {
      text-align: left;
    }
    h2 {
      font-size: 18px;
      font-weight: 800;
      line-height: 30px;
    }
    &.brands-section-title-index8 {
      text-align: left;
      position: absolute;
      left: 0px;
      top: 2px;
      background: ${({ theme }) => theme.colors.whiteColor};
      z-index: 2;
      padding-right: 30px;
    }
  }

  /*-- brands-slider style --*/
  .brands-slider {
    position: relative;
    width: 100%;
    height: 50px;
    overflow: hidden;

    &-container {
      width: calc(200px * 12);
      display: flex;
      align-items: center;
      gap: 0px;
      animation: smoothSlider 25s infinite linear;
    }
    .slider-item {
      width: 200px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    &::before {
      position: absolute;
      z-index: 1;
      content: "";
      top: 0;
      left: 0;
      width: 120px;
      height: 100%;
      background: linear-gradient(
        270deg,
        #ffffff 0%,
        rgba(255, 255, 255, 0) 100%
      );
      transform: rotate(-180deg);
    }

    &::after {
      position: absolute;
      z-index: 1;
      content: "";
      top: 0;
      right: 0;
      width: 120px;
      height: 100%;
      background: linear-gradient(
        270deg,
        #ffffff 0%,
        rgba(255, 255, 255, 0) 100%
      );
    }
    &.sass {
      &::after {
        background: linear-gradient(
          270deg,
          #f2f6fd 0%,
          rgba(255, 255, 255, 0) 100%
        );
      }
      &::before {
        background: linear-gradient(
          270deg,
          #f8fbff 0%,
          rgba(255, 255, 255, 0) 100%
        );
      }
    }
    &.v8 {
      height: 36px;
      &::before {
        left: 100px;
      }
      .slider-item {
        height: 36px;
        max-width: 178px;
        img {
          max-width: 105px;
        }
      }
    }

    &.newslater {
      height: 36px;
      &::before {
        left: 330px;
        background: linear-gradient(
          270deg,
          #eef2f5 0%,
          rgba(238, 242, 245, 0) 100%
        );
        transform: rotate(180deg);
      }
      &::after {
        background: linear-gradient(
          270deg,
          #eef2f5 0%,
          rgba(238, 242, 245, 0) 100%
        );
      }
      .slider-item {
        height: 36px;
        max-width: 178px;
        img {
          max-width: 105px;
        }
      }
    }
  }
  @keyframes smoothSlider {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(calc(-200px * 6));
    }
  }
  /*-- brands-section end --*/

  @media screen and (max-width: 1199px) {
    &.v8 {
      padding: 40px 20px;
      margin-bottom: 72px;
    }
    &.corporate-brands-section {
      padding: 100px 0px;
    }
  }
  @media screen and (max-width: 991px) {
    &.corporate-brands-section {
      padding: 90px 0px;
    }
  }
  @media screen and (max-width: 767px) {
    padding-top: 70px;
    &.newslater {
      padding: 40px 20px;
      .brands-section-title {
        position: inherit;
      }
    }
    &.corporate-brands-section {
      padding: 60px 0px;
    }
    &.sass {
      padding-top: 40px;
    }
    .brands-slider-container {
      gap: 50px;
    }
    .slider-item {
      width: 95px;
      height: 18px;
    }
    &.newslater::before {
      left: 0px;
    }
  }
  @media screen and (max-width: 374px) {
    .brands-section-title h2 {
      font-size: 16px;
    }
    .brands-section-title h2 {
      font-size: 16px;
    }
  }
`;

export default BrandSliderStyleWrapper;
