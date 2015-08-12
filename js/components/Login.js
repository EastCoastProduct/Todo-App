import React, { findDOMNode } from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import auth from '../auth';

let Login = React.createClass({ 
	mixins: [Router.Navigation],

	getInitialState() {
    	return {
      		error: false
    	};
  	},

  	loginUser(e) {
      	e.preventDefault();
  		  var email = findDOMNode(this.refs.email).value;
      	var pass = findDOMNode(this.refs.pass).value;

      	auth.login(email, pass, (loggedIn) => {
        		if (!loggedIn) {
        			  return this.setState({ error: true });
        		} else {
        		    this.transitionTo('moduleslist');
        		}
          

        //var { location } = this.props;
        //console.log({ location });
  	  /*
        if (location.state && location.state.nextPathname) {
          this.replaceWith(location.state.nextPathname);
        } else {
          this.replaceWith('/newuser');
        }*/
      });
  },

  render() {
      return (
          <form onSubmit={this.loginUser}>
              <label><input ref="email" placeholder="email"/></label>
              <label><input type="password" ref="pass" placeholder="password"/></label>
              <button type="submit">login</button>
              {this.state.error && (
                  <p>Bad login information</p>
              )}
          </form>
      );
  }
});

export default Login;  