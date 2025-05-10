import styled from "styled-components";

const SectionTitleStyleWrapper = styled.div`
  margin-bottom: 38px;

  p {
    margin-bottom: 5px;
  }

  &.v8 {
    p {
      color: ${({ theme }) => theme.colors.v8Title};
      font-family: ${({ theme }) => theme.fonts.dmSans};
      font-size: 18px;
      font-weight: 700;
      line-height: 30px;
      letter-spacing: 0.2em;
      margin-bottom: 10px;
    }
    &.title2 {
      p {
        color: ${({ theme }) => theme.colors.v8Title2};
      }
      h2 {
        color: ${({ theme }) => theme.colors.whiteColor};
      }
    }
  }

  .sub-title {
    text-transform: uppercase;
    font-size: 18px;
    font-weight: 700;
    line-height: 30px;
    color: ${({ theme }) => theme.colors.primary};
    letter-spacing: 0.2em;
    margin-bottom: 12px;
    display: block;
  }

  .green-color {
    color: ${({ theme }) => theme.colors.primary6Deep};
  }

  .green-lite {
    color: ${({ theme }) => theme.colors.v8Title2};
  }

  .title {
    line-height: 60px;
    font-weight: 800;
    .caveat {
      font-size: 50px;
      line-height: 50px;
    }
  }

  h6 {
    margin-top: 12px;
  }

  h5 {
    font-family: ${({ theme }) => theme.fonts.dmSans};
    font-size: 18px;
    font-weight: 500;
    line-height: 26px;
    margin-top: 12px;
  }

  .love-icon {
    svg {
      color: ${({ theme }) => theme.colors.badgeColor};
    }
  }

  &.crypto {
    .sub-title {
      color: #01ffb0;
    }
    .title {
      color: ${({ theme }) => theme.colors.whiteColor};
    }
  }

  &.crypto2 {
    .sub-title {
      color: #4541fe;
    }
    .title {
      color: ${({ theme }) => theme.colors.title};
    }
  }

  &.crypto2 {
    &.title-green {
      .sub-title {
        color: #9fe870;
      }
      .title {
        color: ${({ theme }) => theme.colors.whiteColor};
      }
    }
  }

  &.corporate {
    .sub-title {
      color: #5ecc62;
    }
    .title {
      color: ${({ theme }) => theme.colors.title};
      font-size: 47px;
    }
  }

  &.sass {
    .sub-title {
      color: #0555ff;
    }
    .title {
      color: ${({ theme }) => theme.colors.title};
    }
  }

  &.defi {
    .sub-title {
      color: #37ea8e;
    }
    .title {
      color: ${({ theme }) => theme.colors.whiteColor};
      span.liniar {
        background: linear-gradient(90deg, #37ea8e 35.54%, #bdf93f 65.12%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-fill-color: transparent;
      }
    }
  }

  @media screen and (max-width: 1199px) {
    margin-bottom: 30px;

    h2 {
      font-size: 36px;
      line-height: 45px;
    }
    .title .caveat {
      font-size: 40px;
    }
  }
  @media screen and (max-width: 991px) {
    h2 br {
      display: none;
    }
    .convert-visitors-slider-right .section-title h2 {
      font-size: 26px;
      margin-bottom: -20px;
    }
  }
  @media screen and (max-width: 767px) {
    .sub-title {
      font-size: 16px;
    }
    .lets-talk-text h2,
    .title,
    .team-section .section-title h2,
    .about-feature-section .about-feature-title h2 {
      font-size: 36px;
      line-height: 45px;
    }
  }
  @media screen and (max-width: 575px) {
    .download-wallet-overlay .section-title {
      text-align: center;
    }
  }
  @media screen and (max-width: 480px) {
    .team-section .section-title {
      margin-bottom: 40px;
    }
    .team-section .section-title h3 {
      margin-bottom: 10px;
      font-size: 16px;
      line-height: 26px;
    }
    .team-section .section-title h2 {
      font-size: 22px;
      line-height: 40px;
    }
    .crypto2-benifits-section .section-title.crypto2.text-center {
      text-align: left !important;
    }
  }
  @media screen and (max-width: 374px) {
    .contact-content h2,
    .core-feature-title h2,
    .skills-content h2,
    .building-content h2,
    .lets-talk-text h2,
    .title,
    .team-section .section-title h2,
    .about-feature-section .about-feature-title h2,
    .customer-content-text h2,
    .feature-team-slider-for .slider-item h2,
    .how-works-title h2,
    .usability-card-title h2,
    .faq-section-title h2,
    .pricing-section-title h2,
    .testimonial-title h2,
    .marketing-content-title h2,
    h2 {
      font-size: 32px !important;
      line-height: 42px;
    }
  }
`;

export default SectionTitleStyleWrapper;
