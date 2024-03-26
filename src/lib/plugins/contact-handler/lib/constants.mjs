export const CONTACT_EMAILER_ZIP_NAME = 'contact-emailer-lambda.zip'
export const CONTACT_HANDLER_ZIP_NAME = 'contact-handler-lambda.zip'
export const REQUEST_SIGNER_ZIP_NAME = 'request-signer-lambda.zip'

export const STANDARD_FORM_FIELDS = {
  // ID
  given_name : 'S',
  family_name : 'S',
  company : 'S',
  // demo
  company_size: 'S',
  industry: 'S',
  revenue: 'S',
  // contact
  email : 'S',
  phone_number_home: 'S',
  phone_number_mobile: 'S',
  phone_number_work: 'S',
  phone_number_work_ext: 'S',
  // location
  address_1: 'S',
  address_2: 'S',
  city : 'S',
  state : 'S',
  zip_code : 'S',
  county : 'S',
  // purpose
  message: 'S',
  topics : 'SS'
}