// formik use: https://formik.org/docs/examples/with-material-ui
// yup validation spec: https://leanylabs.com/blog/form-validation-in-react/#what-is-yup
import clsx from 'clsx';

import Link from '@docusaurus/Link'
import { useFormik } from 'formik'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { styled } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import * as yup from 'yup';

import styles from './styles.module.css'

import devopsServices from '@site/data/devops-services'
import securityAndComplianceServices from '@site/data/security-and-compliance-services'
import softwareEngineeringServices from '@site/data/software-engineering-services'

const NOT_SUBMITTED = 'NOT_SUBMITTED'
const SUBMITTING = 'SUBMITTING'
const SUBMIT_ERROR = 'SUBMIT_ERROR'
const NETWORK_ERROR = 'NETWORK_ERROR'
const SUBMITTED = 'SUBMITTED'

// flatten the services data into a single array for the 'topics' select box
const topics = [
  ...devopsServices.map(({title}) => ({ group: 'DevOps', label: title, value: title })),
  ...securityAndComplianceServices.map(({title}) => ({ group: 'Security and compliance', label: title, value: title })),
  ...softwareEngineeringServices.map(({title}) => ({ group: 'Sofware engineering', label: title, value: title }))
]

const validationSchema = yup.object({
  email: yup
    .string()
    .required('Email is required')
    .email('Enter a valid email'),
  message: yup
    .string()
    .required('A message is required')
});

const GroupHeader = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: '-8px',
  padding: '4px 10px',
  color: 'white',
  backgroundColor: 'var(--ifm-color-primary)'
}));

const GroupItems = styled('ul')({
  color: 'var(--ifm-color-primary)',
  padding: 0,
});

const actionHandler = '/contact-handler'

const ContactForm = () => {
  const [submitStatus, setSubmitStatus] = useState(NOT_SUBMITTED)
  const formik = useFormik({
    initialValues: {
      given_name: '',
      family_name: '',
      email: '',
      company: '',
      message: ''
    },
    validationSchema: validationSchema,
    onSubmit: () => { setIsSubmitted(true) }
  });

  const [isReadyToSubmit, setIsReadyToSubmit] = useState(false)
  const emailValue = formik.values.email
  const emailTouched = formik.touched.email
  const messageValue = formik.values.message
  const messageTouched = formik.touched.message
  const emailInError = Boolean(formik.errors.email)
  const messageInError = Boolean(formik.errors.message)

  useEffect(() => {
    if (emailValue && emailInError === false && messageValue && messageInError === false) {
      setIsReadyToSubmit(true)
    }
    else {
      setIsReadyToSubmit(false)
    }
  }, [emailTouched, emailInError, messageTouched, messageInError])

  const [mailtoAction, setMailToAction] = useState('mailto:')
  const formValues = formik.values

  useEffect(() => {
    const emailBody = Object.keys(formValues).reduce((acc, key) => {
      if (!key.startsWith('topics')) {
        acc += `${key}: ${formValues[key]}\n`
      }
      return acc
    }, '')
      + (formValues.topics?.length > 0 ? 'topics:\n- ' + formValues.topics.join('\n- ') : '')

    const mailtoActionString = 
      'mailto:inquiries@liquid-labs.com?subject=Contact form submission&body=' + encodeURIComponent(emailBody)
      .replaceAll(/\s+/g, '+')

    setMailToAction(mailtoActionString)
  }, [formValues])

  let topicValues

return submitStatus === SUBMITTED
  ? (
      <div style={{ paddingTop: '2rem', textAlign: 'center' }}>
        <h1 style={{borderBottom: 'none'}}>Thank you</h1>
        Your form has been submitted and you should hear back from us within 1-2 business days.
      </div>
    )
  : submitStatus === SUBMITTING
  ? (
      <div style={{ paddingTop: '2rem', textAlign: 'center' }}>
        <h1 style={{borderBottom: 'none'}}>Submitting...</h1>
        Your form is being processed.
      </div>
    )
  : submitStatus === SUBMIT_ERROR
  ? (
      <div style={{ paddingTop: '2rem', textAlign: 'left', margin: '0 auto', width: '75%', maxWidth: '30rem' }}>
        <h1 style={{borderBottom: 'none', textAlign: 'center'}}>Submit error</h1>
        Unfortunately, there was an error submitting your form.
        <ol>
          <li>You can try <Link 
            to={/* 'to' is important to turn this into a :link so it gets the proper styling */"/contact"}
            onClick={() => setSubmitStatus('NOT_SUBMITTED')}>try submitting the form again</Link>.</li>
          <li>Try submitting a pre-filled form by <a href={mailtoAction}>clicking here</a>,</li> or
          <li><a href="mailto:inquiries@liquid-labs.com">email us inquiries@liquid-labs.com</a>.</li>
        </ol>
      </div>
    )
  : (
      <form>
        { submitStatus === NETWORK_ERROR ? (<div style={{backgroundColor: 'rgba(255,0,0,.25)'}}><span style={{fontWeight: 'bold'}}>NETWORKING ERROR</span>: A network error was detected. You may be offline or have poor connectivitiy. Try submitting again and if you still have problems, check your network connection and submit after addressing any issues.</div>) : null}
        <div className="row">
          <div className="col col--6">
            <TextField id="given-name-input" 
              label="Given name"
              name="given_name"
              value={formik.values.given_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.given_name && Boolean(formik.errors.given_name)}
              helperText={formik.touched.given_name && formik.errors.given_name}
            />
            <TextField id="family-name-input"
              label="Family name"
              name="family_name"
              value={formik.values.family_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.family_name && Boolean(formik.errors.family_name)}
              helperText={formik.touched.family_name && formik.errors.family_name}
            />
            <TextField id="email-input"
              required
              label="Email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField id="company-input" 
              label="Company"
              name="company"
              value={formik.values.company}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.company && Boolean(formik.errors.company)}
              helperText={formik.touched.company && formik.errors.company}
            />
          </div>
          <div className="col col--6" style={{ display: 'flex', flexDirection: 'column', }}>
            <Autocomplete id="topics-input"
              multiple
              disableCloseOnSelect
              limitTags={2}
              name="topics"
              options={topics}
              groupBy={(option) => option.group}
              getOptionLabel={(option) => option.label}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  label="Topics"
                />
              )}
              renderGroup={(params) => (
                <li key={params.key}>
                  <GroupHeader>{params.group}</GroupHeader>
                  <GroupItems>{params.children}</GroupItems>
                </li>
              )}
              onChange={(event, value, reason) => {
                // formik dosen't track the values itself, so we grab them here
                formik.values.topics = value
                formik.handleChange(event, value, reason)
              }}
              onBlur={formik.handleBlur}
              error={formik.touched.topics && Boolean(formik.errors.topics)}
            />
            <div className={styles.multiline_container}>
              <TextField id="message-input"
                required
                multiline
                label="Message"
                name="message"
                value={formik.values.message}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.message && Boolean(formik.errors.message)}
                helperText={formik.touched.message && formik.errors.message}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col col--12" style={{ textAlign: 'right', marginTop: 'var(--ifm-spacing-vertical)' }}>
            <Link 
              className={clsx('button', 'button--secondary button--lg', !isReadyToSubmit && 'disabled')}
              onClick={() => doSubmit(formik, setSubmitStatus, topicValues)}>
              Submit
            </Link>
          </div>
        </div>
      </form>)
      // <button type="submit" className={clsx('button', 'button--lg')}>Submit</button>
      /*{onClick={() => formik.handleSubmit(formik.values) && isReadyToSubmit} to={actionHandler}*/
}
// this is just to reset the formatting in Sublime Text

const doSubmit = (formik, setSubmitStatus, topicValues) => {
  // formik.handleSubmit() // does this do anything?

  setSubmitStatus(SUBMITTING)
  const formValues = formik.values
  const submitValues = Object.entries(formValues).reduce((acc, [key, value]) => {
    if (!key.startsWith('topics')) {
      acc[key] = value
    }
    return acc
  }, {})

  if (formValues.topics?.length > 0) {
    submitValues.topics = formValues.topics.map(({ value }) => value)
  }

  fetch('/contact-handler', {
    body: JSON.stringify(submitValues),
    headers: {'Content-Type': 'application/json'},
    method: 'POST'
  })
    .then((response) => {
      if (response.ok) {
        setSubmitStatus(SUBMITTED)
      }
      else {
        setSubmitStatus(SUBMIT_ERROR)
      }
    })
    .catch((e) => {
      setSubmitStatus(NETWORK_ERROR)
    })
}

export default ContactForm