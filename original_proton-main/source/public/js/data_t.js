const path = require ('path');
const fs = require ('fs');
const Papa = require ('papaparse');
const axios = require ('axios');

function mkDir (filename) {
  (header = {
    auth: {
      username: key,
      password: token,
    },
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  }), (data = {
    name: filename,
  });
  return axios
    .post ('https://api.sweepapi.com/directory', data, header)
    .then (response => {
      return response.data['id'];
    });
}

function mkStream (id_dir, name_stream, data) {
  header = {
    auth: {
      username: key,
      password: token,
    },
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };
  data = {
    directory_id: id_dir,
    name: name_stream,
    inputDataVar: data,
  };
  return axios
    .post ('https://api.sweepapi.com/stream', data, header)
    .then (response => {
      return response.data['stream_id'];
    });
}

function fetchDataCols (columns) {
  let dirID;
  let streamID;
  let stream;
  let timestamp;
  let ts_params = [];
  for (const [key, value] of Object.entries (columns)) {
    if (value == 'directory') {
      dirID = mkDir (key);
    }
    if (value == 'stream') {
      stream = key;
    }
    if (value == 'timestamp') {
      timestamp = key;
    }
    if (value == 'ts_param') {
      ts_params.push (key);
    }
  }
  let inputDataVar = [];
  ts_params.forEach (function (item, index, array) {
    inputDataVar.push ({
      var_name: item,
      display_name: item,
      type: 'number',
    });
  });
  dirID.then (function (result) {
    console.log ('dir id ', result);
    streamID = mkStream (result, stream, inputDataVar);
    streamID.then (function (result) {
      const csvFilePath = path.resolve (
        'source/public/datasets/client_data.csv'
      );
      const fileStream = fs.createReadStream (csvFilePath, {
        highWaterMark: 1024,
      });
      let timestampVal;
      let tsParamVals = [];
      let tsParamNames = [];
      Papa.parse (fileStream, {
        header: true,
        dynamicTyping: true,
        step: function (results) {
          for (const [keyVal, value] of Object.entries (results.data)) {
            if (keyVal == timestamp) {
              timestampVal = value;
            } else if (ts_params.includes (keyVal)) {
              tsParamVals.push (value);
              tsParamNames.push (keyVal);
            }
          }
          header = {
            auth: {
              username: key,
              password: token,
            },
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          };
          for (let i = 0; i < tsParamNames.length; i++) {
            data = {
              timestamp: timestampVal,
              sample: tsParamVals[i],
            };
            axios
              .post (
                'https://api.sweepapi.com/stream/' +
                  result +
                  '/ts/' +
                  tsParamNames[i] +
                  '/dataset',
                data,
                header
              )
              .then (function (response) {
                console.log ('added data to stream: ', response.data);
              })
              .catch (function (error) {
                console.log (error);
              });
          }
          tsParamVals = [];
          tsParamNames = [];
        },
        complete: results => {},
      });
      const uploadedFile = 'source/public/data/client.csv';
      fs.unlink (uploadedFile, err => {
        if (err) {
          console.error (err);
          return;
        }
      });
    });
  });
}

module.exports = {
  fetchDataCols,
};
