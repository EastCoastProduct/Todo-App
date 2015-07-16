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
    name: 'users', afterInject: function(){
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

var UserItem = React.createClass({
    getInitialState: function () {
        return {
            value: this.props.user.first_name
        }
    },

    remove: function () {
        //firebaseDb.destroy(this.props.user.id); //also add remove user functionality
    },

    edit: function () {
        //todo: onclick redirect to edit user
    },

    render: function () {
      var user = this.props.user;
    
      return <ul className='task-list'>
                  <li key={ user.id } className=''>
                        <span className='task-title'>
                            <span className='task-title-sp'>{this.state.value}</span>
                            <div className='pull-right'>
                                <button type='button' className='btn btn-primary btn-xs'>
                                    <i className='fa'> edit </i>
                                </button>
                                <button type='button' className='btn btn-danger btn-xs' >
                                    <i className='fa'> delete </i>
                                </button>
                            </div>
                        </span>
                    </li>
                </ul>;
    }
  });

  var UsersList = React.createClass({
    getInitialState: function () {
        firebaseDb.findAll();
        return { users: firebaseDb.getAll(), first_name: '' };
    },

    componentDidMount: function () {
    	ref.on('child_added', function (dataSnapshot) {
            var data = dataSnapshot.val();
            if (data[Resource.idAttribute]) {
                Resource.eject(data[Resource.idAttribute]);
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
        this.setState({ users: firebaseDb.getAll(), first_name: this.props.first_name || '' });
    },

    onInput: function (event) {
        this.setState({ users: this.state.users, first_name: event.target.value });
    },

    componentWillUnmount: function () {
        firebaseDb.off('change', this.onChange);
    },

    redirectToNewUser: function () {
    	//create redirect
    },

    render: function () {
      var users = this.state.users;
      var _singleItems = [];

      users.forEach(function (user, i) {
        _singleItems.push(<UserItem key={i} user={users[i]} />);
      });

      return <div className='panel-body'>
                 <div className='task-content'>
                 	{ _singleItems }
                 </div>  
                 <div>
                 	<button type='button' onClick={this.redirectToNewUser} className='btn btn-success btn-sm pull-left'>Add new user</button>
                 </div>
             </div>;
    }
  });

module.exports = UsersList;