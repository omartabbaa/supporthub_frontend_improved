import styled from "styled-components";

const ParallaxStyleWrapper = styled.section`
  /*-- index2-statistics-section start --*/
  .index2-statistics-section {
    background: transparent;
    border-top: 1px solid ${({ theme }) => theme.colors.blackColor}26;
    border-bottom: 1px solid ${({ theme }) => theme.colors.blackColor}26;
    height: auto;
    margin-bottom: 135px;
    margin-top: 135px;
    position: relative;
    z-index: 0;
    & .index2-statistics-content {
      background-size: cover;
      background-position: center center;
      background-repeat: no-repeat;
      width: 100%;
      padding: 77.5px 0;
      position: relative;
      z-index: 0;
    }
    .react-parallax-bgimage {
      width: auto !important;
    }
  }
  .statistics-text {
    & h2 {
      color: ${({ theme }) => theme.colors.primary};
    }
    & p {
      font-size: 18px;
      font-weight: 500;
      line-height: 40px;
      color: ${({ theme }) => theme.colors.title};
    }
    &.v6 {
      h2,
      p {
        color: ${({ theme }) => theme.colors.v6templateColor};
      }
    }
  }
  /*-- index2-statistics-section End --*/
  @media screen and (max-width: 1199px) {
    .index2-statistics-section {
      min-height: auto;
    }
    .index2-statistics-section .index2-statistics-content {
      min-height: auto;
      padding: 60px 20px;
    }
    .statistics-text h2 {
      font-size: 30px;
      line-height: 35px;
    }
  }
  @media screen and (max-width: 767px) {
    /*-- brands-section End --*/
    .index2-statistics-section {
      margin-bottom: 70px;
    }
  }
  @media screen and (max-width: 575px) {
    .statistics-text {
      text-align: center;
    }
  }
`;

export default ParallaxStyleWrapper;
