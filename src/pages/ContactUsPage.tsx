import { getContactUs } from "@/api/ownerContent";
import { OwnerContentPage } from "@/components/common/OwnerContentPage";

const ContactUsPage = () => (
  <OwnerContentPage
    queryKey="contact-us"
    fallbackTitle="Contact Us"
    fetcher={getContactUs}
  />
);

export default ContactUsPage;
