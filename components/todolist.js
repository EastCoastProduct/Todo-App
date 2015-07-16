/** @jsx React.DOM */
var React = require('react');
var JSData = require('js-data');
var DSFirebaseAdapter = require('js-data-firebase');

var store = new JSData.DS();
var firebaseAdapter = new DSFirebaseAdapter({
    basePath: 'https://app-todo-list.firebaseio.com'
});
store.registerAdapter('firebase', firebaseAdapter, { default: true });

var firebaseDb = store.defineResource({
    name: 'task', afterInject: function(){
        firebaseDb.emit('change');
    },
    afterEject: function(){
        firebaseDb.emit('change');
    }
});

for (var resourceName in store.definitions){
        var Resource = store.definitions[resourceName];
        var ref = firebaseAdapter.ref.child(Resource.endpoint);
    };

var TaskItem = React.createClass({
    getInitialState: function () {
        return {
            value: this.props.task.name
        }
    },

    remove: function () {
        firebaseDb.destroy(this.props.task.id);
    },

    edit: function () {
        if (this.state.value.trim().length !== 0) {
            firebaseDb.update(this.props.task.id, { name: this.state.value });
        };
    },

    handleChange: function (event) {
        this.setState({
            value: event.target.value
        });
    },

    render: function () {
      var task = this.props.task;
    
      return <ul className='task-list'>
                  <li key={ task.id } className=''>
                        <span className='task-title'>
                            <input type='text' className='task-title-sp' value = {this.state.value} onChange = {this.handleChange} />
                            <div className='pull-right'>
                                <button type='button' onClick={this.edit} className='btn btn-primary btn-xs'>
                                    <i className='fa'> edit </i>
                                </button>
                                <button type='button' onClick={this.handleComplete} className='btn btn-success btn-xs'>
                                    <i className='fa'> completed </i>
                                </button>
                                <button type='button' onClick={this.remove} className='btn btn-danger btn-xs' >
                                    <i className='fa'> delete </i>
                                </button>
                            </div>
                        </span>
                    </li>
                </ul>;
    }
  });

  var TodoList = React.createClass({

    getInitialState: function () {
        firebaseDb.findAll();
        return { tasks: firebaseDb.getAll(), name: '' };
    },

    componentDidMount: function () {
        ref.on('child_changed', function (dataSnapshot) {
            var data = dataSnapshot.val();
            if (data[Resource.idAttribute]) {
                Resource.inject(data);
            }
        });
        ref.on('child_removed', function (dataSnapshot) {
            var data = dataSnapshot.val();
            if (data[Resource.idAttribute]) {
                Resource.eject(data[Resource.idAttribute]);
            }
        });
        firebaseDb.on('change', this.onChange);
    },

    onChange: function () {
        this.setState({ tasks: firebaseDb.getAll(), name: this.props.name || '' });
    },

    onInput: function (event) {
        this.setState({ tasks: this.state.tasks, name: event.target.value });
    },

    componentWillUnmount: function () {
        firebaseDb.off('change', this.onChange);
    },

    createTask: function (e) {
        var _this = this;
        e.preventDefault(); //prevent page reload
        if (this.state.name.trim().length !== 0) {
            firebaseDb.create({
                name: _this.state.name
            });
            this.setState({name: ""}); //clear input
        };
    },

    render: function () {
      var tasks = this.state.tasks;
      var _singleItems = [];

      tasks.forEach(function (task, i) {
        _singleItems.push(<TaskItem key={i} task={tasks[i]} />);
      });

      return <div className='panel-body'>
                 <div className='task-content'>
                         { _singleItems }
                 </div>  
                 <form onSubmit={this.createTask } >
                    <div className='col-sm-5 nopaddingLeft'>
                        <input type="text" className='form-control' onChange= { this.onInput } value= { this.state.name } />
                    </div>
                    <AddNewTaskButton />
                </form>
             </div>;
    }
  });

var AddNewTaskButton = React.createClass({
    render: function(){
        return <div className='add-task-row'>
                    <button className='btn btn-success btn-sm pull-left'> Add new task </button>
                </div>
    }
});

module.exports = TodoList;