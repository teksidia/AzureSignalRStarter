const LOCAL_BASE_URL = 'http://localhost:7071'; // local Azure function ( calls negotiate - signalR server - by convention)
const REMOTE_BASE_URL = 'https://greeeeeet1234.azurewebsites.net';

// helper function to make it easy to work in local and deployed contexts
const getAPIBaseUrl = () => {
    const isLocal = /localhost/.test(window.location.href);
    return isLocal ? LOCAL_BASE_URL : REMOTE_BASE_URL;
}

const app = new Vue({
    el: '#app',
    data() {
        return {
            stocks: []
        }
    },
    methods: {
        async getStocks() {
            try {
                const apiUrl = `${getAPIBaseUrl()}/api/getStocks`;
                const response = await axios.get(apiUrl);
                app.stocks = response.data;
            } catch (ex) {
                console.error(ex);
            }
        }
    },
    created() {
        this.getStocks(); // called once when component is created (note: no polling)
    }
});

const connect = () => {

    // first action is to use the SignalR SDK to create a connection by calling HubConnectionBuilder. The result is a SignalR connection to the server.
    const connection = new signalR.HubConnectionBuilder()
                            .withUrl(`${getAPIBaseUrl()}/api`)
                            .build();

     // to gracefully recover after the server has timed out, the onclose handler reestablishes a connection two seconds after the connection has closed by calling connect again.
    connection.onclose(()  => {
        console.log('SignalR connection disconnected');
        setTimeout(() => connect(), 2000);
    });

    // listens for messages
    connection.on('updated', updatedStock => {
        // new version is inserted at the same index position in the array as replaced old version
        const index = app.stocks.findIndex(s => s.id === updatedStock.id);
        app.stocks.splice(index, 1, updatedStock);
    });

    connection.start().then(() => {
        console.log("SignalR connection established");
    });
};

connect(); // called on page load

// try and execute command ```npm run update-data```!