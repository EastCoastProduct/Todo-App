import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';
import Dropzone from 'react-dropzone';

//when admin changes his data (image), he is redirected to wrong page, and left side dont update

let EditUser = React.createClass({
	mixins: [Router.Navigation],
    
	getInitialState() {
		return { id: this.props.query.id, message: '', description: '' };
	},

	componentWillMount() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/');
        this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.state.id);
        this.getUserData();
        this.userFb.on('child_added', function(snap) {
            var data = snap.val();
            var key = snap.key();
            if (data != null && key == "image") {
                this.setState({ image: data })
            }
        }.bind(this));
        this.userFb.on('child_changed', function(snap) {
            var data = snap.val();
            var key = snap.key();
            if (data != null && key == "image") {
                this.setState({ image: data })
            } else { this.setState({ image: '' }) }
        }.bind(this));
        this.userFb.on('child_removed', function(snap) {
            var data = snap.val();
            var key = snap.key();
            if (key == "image") {
                this.setState({ image: '' })
            }
        }.bind(this));
    },

    componentWillUnmount() {
    	this.firebaseDb.off();
        this.userFb.off();
    },

    getUserData() {
        this.userFb.once("value", function(snapshot){
            var data = snapshot.val();
            this.setState({ firstName: data.first_name, lastName: data.last_name, isAdmin: data.isAdmin });
            if(data.description){
            	this.setState({ description: data.description })
            } 
            if(data.image){
                this.setState({ image: data.image })
            } else {
                this.setState({ image: '' })
            }
        }.bind(this));
    },

    inputFirstNameTextChange(e) {
    	this.setState({firstName: e.target.value, firstNameMessage: '', message: ''});
	},

	inputLastNameTextChange(e) {
    	this.setState({lastName: e.target.value, lastNameMessage: '', message: ''});
	},

	inputDescriptionTextChange(e) {
    	this.setState({description: e.target.value, descriptionMessage: '', message: ''});
	},

    //cancel() {
    //    {auth.isAdmin() ? (this.transitionTo('userinfo', null, {id: this.state.id})) : (this.transitionTo('myaccount'))}
    //},

    editUser(e) {
    	e.preventDefault();
        this.handleValidation(res => {
            if(res){
    			this.userFb.update({ first_name: this.state.firstName, last_name: this.state.lastName, description: this.state.description })
                this.transitionTo('changesuccess', null, { successMessage: 'User info is successfuly changed!' });
            }
        })
    },

    handleValidation(response){
        response = arguments[arguments.length - 1];
        var err = false;

        if(this.state.firstName.trim().length == 0){
            this.setState({ firstNameMessage: 'Enter first name.' });
            err = true;
        }

        if(this.state.lastName.trim().length == 0){
            this.setState({ lastNameMessage: 'Enter last name.' });
            err = true;
        }

        if(this.state.description.trim().length == 0){
            this.setState({ descriptionMessage: 'Enter description.' });
            err = true;
        }

        if(err){ response (false); return; } else { response (true); return; }
    },

    onDrop(files) { //fix users id
        var f = files[0];
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                var id = this.state.id;
                var filePayload = e.target.result;
                var fb = new Firebase('https://app-todo-list.firebaseio.com/users/' + id);
                fb.update({ image: filePayload });
            }.bind(this);
        }.bind(this))(f);
        reader.readAsDataURL(f);
    },

    removeImage(e){
        var imgFb = new Firebase(this.userFb + '/image');
        imgFb.remove();
        this.setState({image: ''});
    },

	render() {
		return <div id='changeData-form'> 
                <fieldset>
                    <div>
                        <Dropzone ref="dropzone" onDrop={this.onDrop} >
                            {this.state.image == '' ? (
                                <div className='paddingAll'>Drop file here, or click to select file to upload.</div>
                            ) : (<div><img className="usersImageEdit" src={ this.state.image }/></div>)}
                        </Dropzone>
                        <div onClick={this.removeImage}>Remove</div>
                    </div>
                    <form className='paddingTop' onSubmit={this.editUser} >
    					<input type='text' placeholder='First name' value={this.state.firstName} onChange = {this.inputFirstNameTextChange} />
                        <div className='errorMessage'>{this.state.firstNameMessage}</div>
    					<input type='text' placeholder='Last name' value={this.state.lastName} onChange = {this.inputLastNameTextChange} />
                        <div className='errorMessage'>{this.state.lastNameMessage}</div>
    					<textarea rows={8} placeholder='Description' value = {this.state.description} onChange = {this.inputDescriptionTextChange} />
                        <div className='errorMessage'>{this.state.descriptionMessage}</div>
    				    <input type='submit' value='Save'/>
    				</form>
                </fieldset>
			</div>
	}
});
export default EditUser;