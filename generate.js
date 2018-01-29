const baseHost = 'sasdf.cf'
const baseURL = `https://${baseHost}/GUpload/`

// The Client ID obtained from the Google API Console. Replace with your own Client ID.
const clientId = "141962813513-bsr1ggi5gcgflu83u9nq22frihh5cda3.apps.googleusercontent.com"

// Scope to use to access user's Drive items.
const scope = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.install'
];

function encodeQuery(data) {
  let ret = [];
  for (let d in data)
    if (data.hasOwnProperty(d))
      ret.push(`${encodeURIComponent(d)}=${encodeURIComponent(data[d])}`);
  return ret.join('&');
}

var queryState = {}
location.search.slice(1).split('&').forEach(e => {
  if (e.slice(0, 6) === 'state=')
    queryState = JSON.parse(decodeURIComponent(e.slice(6)))
})
if (!queryState.folderId) {
  location.href = baseURL
}

class _Auth {
  constructor() {
    this.immtoken = new Promise((resolve, reject) => {
      this.immtokencb = resolve
    })

    if (!this.checkCallback())
      this.triggerImmediate()

    this.load = Promise.all([
      this.immtoken,
    ])
  }

  get token() {
    return (async () => {
      const immtoken = await this.immtoken
      if (immtoken) return immtoken
      this.trigger()
    })()
  }

  handleResult(hash, nonce) {
    const res = {}
    hash.slice(1).split('&').forEach(e => {
      var [name, value] = e.split('=', 2).map(decodeURIComponent)
      res[name] = value
    })
    if (!res.state) return false
    res.state = JSON.parse(res.state)
    console.log(res)
    if (nonce && res.state.nonce !== nonce) return false
    if (res && !res.error && res.access_token) {
      this.immtokencb(res.access_token)
      return res
    }
    return false
  }

  URI(options) {
    const params = Object.assign({
      client_id: clientId,
      response_type: 'token',
      redirect_uri: '',
      scope: scope.join(' '),
      state: '',
      login_hint: queryState.userId || '',
      prompt: 'none',
    }, options)
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + encodeQuery(params)
  }

  checkCallback() {
    const hash = location.hash
    location.hash = ''
    const res = this.handleResult(hash)
    if (res) {
      queryState = res.state
    }
    return res
  }

  trigger() {
    const state = JSON.stringify(Object.assign({}, queryState, {
    }))
    location.href = this.URI({
      redirect_uri: baseURL + 'generate.html',
      prompt: 'consent',
      state,
    })
  }

  triggerImmediate() {
    const nonce = Math.random().toString().slice(2)
    const state = JSON.stringify({
      nonce,
    })
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.src = this.URI({
      redirect_uri: baseURL + 'oauth2callback.html',
      state,
    })
    iframe.onload = () => {
      const loc = iframe.contentWindow.location
      if (loc.host == baseHost) {
        this.handleResult(loc.hash, nonce)
      }
      iframe.remove()
      this.immtokencb()
    }
    document.body.appendChild(iframe)
  }
}
const Auth = new _Auth()

class _Drive {
  constructor() {
    this.load = Promise.resolve()
  }

  async create(body) {
    const token = await Auth.token
    const params = encodeQuery({
      uploadType: 'resumable'
    })
    const path = 'https://www.googleapis.com/upload/drive/v3/files?' + params

    console.log(JSON.stringify(body))
    const res = await fetch(path, {
      method: 'POST',
      mode: 'cors',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json; charset=UTF-8'
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json()
      throw err
    }
    return res.headers.get('location')
  }
}
const Drive = new _Drive()

class _Create {
  constructor() {
    var cont = Promise.resolve()
    if (queryState.name) {
      document.querySelector('.filename').value = queryState.name
      cont = this.link()
    }

    this.load = Promise.all([
      cont,
    ])
  }

  async link() {
    this.disable()
    const name = document.querySelector('.filename').value
    queryState.name = name
    await Auth.token
    await Drive.load
    try{
      const url = await Drive.create({
        name,
        parents: [queryState.folderId],
      }, true)
      document.querySelector('#resultFn').innerText = name
      document.querySelector('#result').value = url
      document.querySelector('.resultDialog').classList.remove('hidden')
      document.querySelector('#result').focus()
      this.close()
    } catch(e) {
      alert(JSON.stringify(e))
      this.enable()
    }
  }

  disable() {
    document.querySelector('.filename').disabled = true
    for(let e of document.querySelectorAll('.createDialog button')){
      e.disabled = true
    }
  }
  
  enable() {
    document.querySelector('.filename').disabled = false
    for(let e of document.querySelectorAll('.createDialog button')){
      e.disabled = false
    }
  }

  close() {
    document.querySelector('.filename').value = ''
    document.querySelector('.createDialog').classList.add('hidden')
  }
}
const Create = new _Create()
