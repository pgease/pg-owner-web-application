import { getPrivacyPolicy } from "@/api/ownerContent";
import { OwnerContentPage } from "@/components/common/OwnerContentPage";

const PrivacyPolicyPage = () => (
  <OwnerContentPage
    queryKey="privacy-policy"
    fallbackTitle="Privacy Policy"
    fetcher={getPrivacyPolicy}
  />
);

export default PrivacyPolicyPage;
