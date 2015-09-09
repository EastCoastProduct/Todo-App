module.exports = {

    login (email, pass, cb) {
        cb = arguments[arguments.length - 1];
        if (localStorage.token) {
            if (cb) cb(true);
            this.onChange(true);
            return;
        }
        loginRequest(email, pass, (res) => {
            if (res.authenticated) {
                localStorage.token = res.token;
                if (!!localStorage.loginError) {
                    delete localStorage.loginError;
                }
                if (cb) cb(true);
                this.onChange(true);
            } else {
                localStorage.loginError = res.loginError;
                if (cb) cb(false);
                this.onChange(false);
            }
        });
        getUserData(email, (res) => {
            this.onChange(true);
        })
    },

    getUser() {
        return localStorage.user;
    },

    isAdmin() {
        if (localStorage.admin === "true") {
            return true;
        } else {
            return false;
        }
    },

    getToken() {
        return localStorage.token;
    },

    getUserId() {
        return localStorage.userId;
    },

    getStatus() {
        return localStorage.userStatus;
    }, 

    logout(cb) {
        delete localStorage.token;
        delete localStorage.user;
        delete localStorage.admin;
        delete localStorage.userId;
        delete localStorage.userStatus;
        if (cb) cb();
        this.onChange(false);
    },

    loggedIn() {
        return !!localStorage.token;
    },

    getLoginError() {
        return localStorage.loginError;
    },

    onChange() {}
};

function loginRequest(email, pass, cb) {
    var firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/users/');

    firebaseDb.authWithPassword({ 
        email: String(email),
        password: String(pass)
    }, function(error, authData) {
        if (error) {
            cb({ authenticated: false, loginError: error.message});
        } else {
            cb({ authenticated: true, token: authData.token });
        }
    });
}

function getUserData(email) {
    var firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/users/');

    firebaseDb.orderByChild('email').startAt(email).endAt(email).once('value', function(snapshot){
        var users = snapshot.val();
        for (var k in users) {
            var userRef = new Firebase(firebaseDb + "/" + k);
            userRef.once("value", function(snap) {
                var data = snap.val();
                localStorage.userId = k;
                localStorage.user = data.first_name + " " + data.last_name;
                localStorage.admin = data.isAdmin;
                localStorage.userStatus = data.status;
            })
        }
    })
}
