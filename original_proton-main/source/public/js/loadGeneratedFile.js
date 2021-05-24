function onload () {
  $.ajax ({
    url: '../data/client.csv',
    dataType: 'text',
  }).done (
    function (response) {
      var rows_data = response.split (/\r?\n|\r/);
      var grid = '<table>';
      for (var each_r = 0; each_r < 11; each_r++) {
        if (each_r === 0) {
          grid += '<thead>';
          grid += '<tr>';
        } else {
          grid += '<tr>';
        }
        var eachRow = rows_data[each_r].split (',');
        for (var i = 0; i < eachRow.length; i++) {
          if (each_r === 0) {
            grid += '<th>';
            grid += eachRow[i];
            grid += '</th>';
          } else {
            grid += '<td>';
            grid += eachRow[i];
            grid += '</td>';
          }
        }
        if (each_r === 0) {
          grid += '</tr>';
          grid += '</thead>';
          grid += '<tbody>';
        } else {
          grid += '</tr>';
        }
      }
      grid += '</tbody>';
      grid += '</table>';
      $ ('.leftGrid').append (grid);
    },
    function (data) {
      var rows_data = data.split (/\r?\n|\r/);
      var grid = '<table id="table_data">';
      grid += '<thead>';
      grid += '<tr>';
      var rows_all = rows_data[0].split (',');
      for (var i = 0; i < rows_all.length; i++) {
        grid += '<th>';
        grid += rows_all[i];
        grid += '</th>';
      }
      grid += '</tr>';
      grid += '<tr>';
      for (var i = 0; i < rows_all.length; i++) {
        grid += '<td>';
        grid += '<select class="form-control" id="';
        grid += rows_all[i];
        grid += '">';
        grid += '<option value="dir">directory</option>';
        grid += '<option value="timestamp">timestamp</option>';
        grid += '<option value="stream">stream</option>';
        grid += '<option value="ts_param">ts_param</option>';
        grid += '<option selected value="notApp">not applicable</option>';
        grid += '</select>';
        grid += '</td>';
      }
      grid += '</tr>';
      grid += '</tbody>';
      grid += '</table>';
      $ ('.centerGrid').append (grid);
      var btn_radio =
        '<br><p>Verify if the given data is correct? </p><br><form><input type="radio" name="choice" value="yes"> Yes ';
      btn_radio =
        btn_radio + '<input type="radio" name="choice" value="no"> No ';
      btn_radio =
        btn_radio +
        '<input type="button" id="btn" value="Confirm" onclick=userChoice()></form>';
      $ ('.centerGrid').append (btn_radio);
    }
  );
}

function userChoice () {
  const group_radio = document.querySelectorAll ('input[name="choice"]');
  let temp;
  for (const each of group_radio) {
    if (each.checked) {
      temp = each.value;
      break;
    }
  }
  if (temp == 'no') {
    var input = '<br><p>Enter Stream Name.</p>';
    input =
      input +
      '<form><input id="streamText" placeholder="stream name" required>';
    input =
      input +
      '<input type="button" id="stream-btn" value="Add Stream" onclick="setCT()"></form>';
    $ ('.centerGrid').append (input);
  } else {
    setCT ();
  }
}

function setCT () {
  var grid = document.getElementById ('table_data');
  var variance = {};
  var count_d = 0;
  var count_s = 0;
  var count_t = 0;
  var name_s = '';
  for (var each_row = 0; each_row < 1; each_row++) {
    for (
      var each_col = 0;
      each_col < grid.rows[each_row].cells.length;
      each_col++
    ) {
      var key = grid.rows[each_row].cells[each_col].innerHTML;
      var temp = '#' + key + ' option:selected';
      var value = $ (temp).text ();
      if (value == 'directory') {
        count_d++;
      }
      if (value == 'stream') {
        count_s++;
      }
      if (value == 'timestamp') {
        count_t++;
      }
      variance[key] = value;
    }
  }
  if (count_d > 1) {
    alert ('Directory Count>1 : Not Allowed');
    return;
  } else if (count_s > 1) {
    alert ('Stream Count>1 : Not Allowed');
    return;
  } else if (count_t > 1) {
    alert ('Timestamp Count>1 : Not Allowed');
    return;
  } else if (count_d == 0 || count_t == 0) {
    alert ('Atleast 1 Directory 1 Timestamp Needed.');
    return;
  } else if (count_s == 0) {
    name_s = document.getElementById ('streamText').value;
    if (name_s == '') {
      alert ('Stream Name Cannot be empty.');
      return;
    }
    variance.streamColumn = name_s;
  }
  tree_display (variance);
  if (variance) {
    $.post ('/import', variance);
  }
  var successBtn = '<form action="/import" method="POST">';
  successBtn =
    successBtn +
    '<input type="submit" name="success" value="Submit to Database" style="color: white; background-color: #001648; padding: 10px 15px; border: none; text-align: center; align-items: center;" /></form>';
  $ ('.successBtn').append (successBtn);
}

function tree_display (variance) {
  var tree = '';
  var streamName = '';
  var dirName = '';
  var ts_params = [];
  for (x in variance) {
    if (variance[x] == 'directory') {
      dirName = x;
    } else if (variance[x] == 'stream') {
      streamName = x;
    } else if (variance[x] == 'ts_param') {
      ts_params.push (x);
    } else if (x == 'streamColumn') {
      streamName = variance[x];
    }
  }
  tree += '<li><span class="caret">' + dirName + '</span>';
  tree += '<ul class="nested">';
  tree += '<li><span class="caret">' + streamName + '</span>';
  tree += '<ul class="nested">';
  for (x in ts_params) {
    tree += '<li>' + ts_params[x] + '</li>';
  }
  tree += '</ul>';
  tree += '</li>';
  tree += '</ul>';
  tree += '</li>';
  tree += '</ul>';
  $ ('.fileStructure').append (tree);
}
