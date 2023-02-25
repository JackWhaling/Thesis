import Axios from "axios";
import https from "https"

const API = Axios.create ({
  baseURL: `https://propavote.com/v1/`,
  timeout: 30000,
})

const exceptionHandler = (e: any) => {
  let responseContent = {};
  if (e.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    if (e.response.data.errors) {
      responseContent = {
        status: e.response.status,
        message: e.response.data.message,
        data: e.response.data.data,
        error: e.response.data.errors,
      };
    } else {
      responseContent = {
        status: e.response.status,
        message: e.response.data.message,
        data: e.response.data.data,
      };
    }
  } else if (e.request) {
    // The request was made but no response was received
    // `e.request` is an instance of XMLHttpRequest in the
    // browser and an instance of
    // http.ClientRequest in node.js
    responseContent = {
      status: 503,
      message: "Service Unavailable",
      data: "",
    };
    //return responseContent;
    //console.log(e.request);
  } else {
    //500 Interval Server Error
    // Something happened in setting up the request that triggered an Error
    //console.log('Error', e.message);
    responseContent = {
      status: 500,
      message: e.message,
      data: "",
    };
  }
  return responseContent;
};

export const putRecord = async (relativeUri: string, data: any, config: any = {}) => {
  let responseContent: any = {
    status: "",
    message: "",
    data: "",
  };

  try {
    let response = await API.put(relativeUri, data, config)
      .then((reponse) => {
        responseContent = {
          status: reponse.status,
          data: reponse.data,
        };
        return responseContent;
      })
      .catch((e) => {
        return exceptionHandler(e);
      });
    return response;
  } catch (e) {
    return exceptionHandler(e);
  }
};

export const postRecord = async (relativeUri: string, data: any, config: any = {}) => {
  let responseContent: any = {
    status: "",
    message: "",
    data: "",
  };
  try {
    let response = await API.post(relativeUri, data, config)
      .then((response) => {
        responseContent = {
          status: response.status,
          data: response.data,
        };
        return responseContent;
      })
      .catch((e) => {
        return exceptionHandler(e);
      });
    return response;
  } catch (e) {
    return exceptionHandler(e);
  }
};

export const getRecord = async (relativeUri: string, config: any = {}) => {
  let responseContent: any = {
    status: "",
    message: "",
    data: "",
  };
  try {
    let response = await API.get(relativeUri, config)
      .then((response) => {
        responseContent = {
          status: response.status,
          data: response.data,
        };
        return responseContent;
      })
      .catch((e) => {
        return exceptionHandler(e);
      });
    return response;
  } catch (e) {
    return exceptionHandler(e);
  }
};

export const deleteRecord = async (relativeUri: string, config = {}) => {
  let responseContent: any = {
    status: '',
    message: '',
    data: '',
  };

  try {
    const response = await API.delete(relativeUri, config)
      .then((reponse) => {
        responseContent = {
          status: reponse.status,
          data: reponse.data,
        };
        return responseContent;
      })
      .catch((e) => {
        return exceptionHandler(e);
      });
    return response;
  } catch (e) {
    return exceptionHandler(e);
  }
};