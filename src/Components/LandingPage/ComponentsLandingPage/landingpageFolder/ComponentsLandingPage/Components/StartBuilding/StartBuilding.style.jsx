import styled from "styled-components";

import DotImg from "../../assets/images/business/fram-4.svg";

const StartBuildingStyleWrapper = styled.section`
  padding: 96px 0;
  background-color: ${({ theme }) => theme.colors.bgHero};
  background-repeat: no-repeat;
  background-position: right;
  background-size: cover;
  position: relative;
  z-index: 0;

  &::after,
  &::before {
    position: absolute;
    z-index: -1;
    content: "";
    top: 0;
    height: 100%;
  }

  &::before {
    left: 0;
    width: 36%;
    background-color: ${({ theme }) => theme.colors.bgHero};
  }

  &::after {
    top: 0;
    right: 0;
    width: 63.5%;
    background-image: url(${DotImg});
    background-repeat: no-repeat;
    background-position: right;
    background-size: cover;
  }

  .section-title {
    margin-bottom: 38px;
  }

  .building-content {
    &-text {
      margin-bottom: 34px;
    }
    h2 {
      color: #ffffff;
    }
  }

  .building-img {
    text-align: right;
  }

  @media screen and (max-width: 1200px) {
    .building-content h2 {
      font-size: 32px;
      line-height: 150%;
    }
  }

  @media screen and (max-width: 767px) {
    padding: 70px 0 80px;
    background-size: cover;

    &::after {
      display: none;
    }

    .building-content{
      text-align: center;
    }

    .building-img {
      margin-top: 60px;
      text-align: center;
    }
  }

  @media screen and (max-width: 575px) {
    padding: 60px 0;
  }

  @media screen and (max-width: 374px) {
    .building-content h2 {
      font-size: 30px;
      line-height: 42px;
    }
  }
`;

export default StartBuildingStyleWrapper;
