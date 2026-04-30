import { getTermsAndConditions } from "@/api/ownerContent";
import { OwnerContentPage } from "@/components/common/OwnerContentPage";

const TermsConditionsPage = () => (
  <OwnerContentPage
    queryKey="terms-and-conditions"
    fallbackTitle="Terms & Conditions"
    fetcher={getTermsAndConditions}
  />
);

export default TermsConditionsPage;
