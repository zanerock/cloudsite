const convertDomainToBucketName = (domain) => domain.replaceAll(/\./g, '-').replaceAll(/[^a-z0-9-]/g, 'x')

export { convertDomainToBucketName }
