const getJavsScript = (src) => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')

    script.onload = resolve
    script.onerror = reject

    script.src = src
    document.body.append(script)
  })
}

const getCss = (href) => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')

    link.onload = resolve
    link.onerror = reject

    link.setAttribute('rel', 'stylesheet')
    link.setAttribute('type', 'text/css')
    link.href=href
    document.body.append(link)
  })
}

const getPdfjsDist = (pdfjsDistPath) => {
  return getJavsScript(`${pdfjsDistPath}/pdf/build/pdf.js`)
  .then(() => {
    return Promise.all([
      getJavsScript(`${pdfjsDistPath}/pdf/web/pdf_viewer.js`),
      getCss(`${pdfjsDistPath}/pdf/web/pdf_viewer.css`)
    ])
  })
}

export default getPdfjsDist