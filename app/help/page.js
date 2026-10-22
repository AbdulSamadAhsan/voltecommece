export const metadata = { title: "Shipping & returns" };
export default function Help() {
  return (
    <div className="container page" style={{ maxWidth: 850 }}>
      <span className="eyebrow">HERE TO HELP</span>
      <h1>A little peace of mind.</h1>
      <div className="panel">
        <h2>Shipping</h2>
        <p className="small">
          We currently ship within the United States. Standard shipping is
          $9.99, free on orders of $150 or more after discounts. Tax and final
          charges are calculated at checkout. Your tracking reference appears in
          your account once your order ships.
        </p>
        <h2>Returns</h2>
        <p className="small">
          Request a return within 30 days of delivery through the store’s
          support team. Items must include original packaging and accessories.
          Online refunds return to the original payment method after approval.
          Cash-on-delivery refunds are arranged with support.
        </p>
        <h2>Payments & order status</h2>
        <p className="small">
          Choose cash on delivery or secure card checkout when enabled. Card
          orders hold inventory for 30 minutes. Only verified payment
          confirmation marks an order paid. Check your account for the latest
          status.
        </p>
      </div>
    </div>
  );
}
