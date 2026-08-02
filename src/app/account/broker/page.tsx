import { redirect } from "next/navigation";

// The broker connect/manage UI now lives on /account/profile — kept as a
// redirect (not a 404) in case anything still links to the old URL.
export default function BrokerAccountPageRedirect() {
  redirect("/account/profile");
}
