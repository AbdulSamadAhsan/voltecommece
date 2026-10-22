export const metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <div className="container page" style={{ maxWidth: 850 }}>
      <h1>Your privacy matters.</h1>
      <div className="panel">
        <p className="small">
          VOLT stores your account details, hashed password, delivery addresses,
          reviews and order history to operate the store. Payment card details
          are handled by Stripe and are never stored by VOLT. Product media is
          hosted by Cloudinary. Session cookies authenticate your account; your
          browser stores your cart, wishlist and theme preference.
        </p>
        <p className="small">
          Administrative actions are logged for security. Order records are
          retained for accounting and fraud prevention. Contact the store
          operator to request access, correction or deletion of personal data.
          The operator must publish its legal name, support contact, retention
          periods and applicable regional privacy terms before launch.
        </p>
      </div>
    </div>
  );
}
