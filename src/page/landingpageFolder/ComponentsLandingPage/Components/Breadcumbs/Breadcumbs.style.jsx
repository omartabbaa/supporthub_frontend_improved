import styled from "styled-components";

const BreadcumbsStyle = styled.section`
  margin-top: 90px;
  padding: 60px 0;
  background-color: ${({ theme }) => theme.colors.bgHero};
  position: relative;
  z-index: 0;

  .shape-img {
    position: absolute;
    z-index: -1;

    &.img-1 {
      bottom: 0;
      left: 4%;
    }

    &.img-2 {
      bottom: 0;
      left: 34%;
    }
  }

  &.blog-details-breadcrumb-section {
    height: 436px;
  }

  &.pricing-plan-breadcrumb-section {
    min-height: 580px;
    padding-top: 95px;
  }

  .pricing-plan-breadcrumb-right {
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    margin-top: 90px;
    .best-pricing-selector form button {
      color: ${({ theme }) => theme.colors.whiteColor};
    }
  }

  .best-pricing-selector {
    margin-bottom: 40px;
    form {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      button {
        color: ${({ theme }) => theme.colors.textColor};
        span {
          color: ${({ theme }) => theme.colors.heroimg1Bg};
        }
        &.active {
          color: ${({ theme }) => theme.colors.title};
        }
      }
      input[type="checkbox"] {
        appearance: none;
        width: 50px;
        height: 24px;
        border: 1px solid ${({ theme }) => theme.colors.blackColor}26;
        border-radius: 15px;
        background-color: ${({ theme }) => theme.colors.whiteColor};
        position: relative;
        cursor: pointer;
        transition: 0.3s;
        &::before {
          position: absolute;
          content: "";
          top: 4px;
          left: 5px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: ${({ theme }) => theme.colors.primary}80;
          transition: 0.3s;
        }
        &:checked {
          background-color: ${({ theme }) => theme.colors.primary};
          &::before {
            left: 28px;
            background-color: ${({ theme }) => theme.colors.whiteColor};
          }
        }
      }
    }
  }

  .breadcrumb-list {
    margin: 0;
    padding: 0;
    list-style: none;
    .breadcrumb-item {
      text-transform: uppercase;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.whiteColor};
      &.active {
        color: ${({ theme }) => theme.colors.whiteColor}b2;
      }
    }
    .breadcrumb-item + .breadcrumb-item::before {
      content: ".";
      font-size: 20px;
      margin: 0px 5px;
      color: ${({ theme }) => theme.colors.whiteColor}b2;
    }
  }

  .breadcrumb-sec {
    .breadcrumb-title {
      text-transform: capitalize;
      font-size: 50px;
      color: ${({ theme }) => theme.colors.whiteColor};
      margin-bottom: 0;
    }
  }

  .breadcrumb-img {
    text-align: right;
  }

  @media screen and (max-width: 991px) {
    margin-top: 70px;

    .breadcrumb-sec .breadcrumb-title {
      font-size: 40px;
    }
  }
  @media screen and (max-width: 767px) {
    .breadcrumb-img {
      margin-top: 40px;
    }
    .breadcrumb-section.blog-details-breadcrumb-section {
      height: 360px;
    }
    .breadcrumb-sec .breadcrumb-title {
      font-size: 40px;
      margin-top: 5px;
    }
    .breadcrumb-sec .breadcrumb-title br {
      display: none;
    }

    .pricing-plan-breadcrumb-right {
      justify-content: flex-start;
      margin-top: 40px;
    }
  }
  @media screen and (max-width: 374px) {
    h1,
    .breadcrumb-sec .breadcrumb-title {
      font-size: 35px;
      line-height: 50px;
    }
  }
`;

export default BreadcumbsStyle;
