export const storefrontReviewStyles = String.raw`
  .reviews-page { max-width: 900px; margin: 0 auto 4rem; }
  .reviews-back { display: inline-block; margin: .5rem 0 1rem; color: #1f4d3a; font-weight: 650; text-decoration: none; }
  .reviews-page h1 { margin: 0 0 1.25rem; color: #16201b; font-size: clamp(1.8rem, 4vw, 2.6rem); }
  .reviews-overview { display: flex; align-items: center; gap: .7rem; margin-bottom: 1.5rem; padding: 1.1rem 1.3rem; border: 1px solid #dce5dc; border-radius: 16px; background: #f4f7f2; color: #425148; }
  .reviews-overview strong { color: #16201b; font-size: 2rem; }
  .review-stars { color: #b78316; letter-spacing: .08em; white-space: nowrap; }
  .reviews-list { display: grid; gap: .85rem; }
  .review-card { padding: 1.2rem 1.3rem; border: 1px solid #e1e4da; border-radius: 16px; background: #fff; }
  .review-card header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .review-card time, .review-buyer { color: #65716a; font-size: .84rem; }
  .review-card p { margin: .8rem 0; color: #26312b; line-height: 1.7; white-space: pre-wrap; overflow-wrap: anywhere; }
  .review-empty, .review-notice { padding: 1.1rem 1.3rem; border-radius: 14px; background: #f4f7f2; color: #49574e; line-height: 1.6; }
  .review-notice a { color: #1f4d3a; font-weight: 650; }
  .review-pagination { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin: 1.25rem 0; color: #58645c; }
  .review-pagination a { color: #1f4d3a; font-weight: 650; text-decoration: none; }
  .review-write { margin-top: 2.5rem; }
  .review-form { display: grid; gap: 1rem; padding: 1.4rem; border: 1px solid #dce5dc; border-radius: 18px; background: #fff; }
  .review-form h2 { margin: 0; color: #16201b; font-size: 1.35rem; }
  .review-form fieldset { margin: 0; padding: 0; border: 0; }
  .review-form legend, .review-form > label { margin-bottom: .45rem; color: #26312b; font-weight: 650; }
  .review-rating-input { display: flex; gap: .2rem; }
  .review-rating-input label { cursor: pointer; }
  .review-rating-input input { position: absolute; opacity: 0; }
  .review-rating-input span { color: #9da69e; font-size: 1.8rem; }
  .review-rating-input input:checked + span, .review-rating-input label:hover span { color: #b78316; }
  .review-rating-input input:focus-visible + span { outline: 2px solid #1f4d3a; outline-offset: 2px; }
  .review-form textarea { min-height: 130px; padding: .85rem 1rem; border: 1px solid #ccd5cc; border-radius: 12px; font: inherit; resize: vertical; }
  .review-form button { justify-self: start; min-height: 46px; padding: 0 1.2rem; border: 0; border-radius: 12px; background: #1f4d3a; color: #fff; font: inherit; font-weight: 650; cursor: pointer; }
  .review-form button:disabled { opacity: .6; cursor: wait; }
  #review-form-message { min-height: 1.2em; margin: 0; color: #1f4d3a; }
  @media (max-width: 560px) { .review-card header { align-items: flex-start; flex-direction: column; gap: .35rem; } .reviews-overview { flex-wrap: wrap; } }
`;
