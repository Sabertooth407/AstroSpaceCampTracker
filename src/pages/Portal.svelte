<script>
    import { login } from '../lib/auth';

    export let navigate;

    let email = '';
    let password = '';
    let error = '';

    async function handleLogin() {
        try {
            const user = await login(email, password);

            if (user.role === 'Admin') {
                navigate('admin');
            } else {
                navigate('student'); 
            }

        } catch (e) {
            error = 'Invalid login';
        }
    }
</script>

<style>
.container {
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: black;
}

.box {
    border: 2px solid #259ad6;
    padding: 30px;
    width: 300px;
}

input {
    width: 100%;
    margin-bottom: 10px;
    padding: 8px;
    background: black;
    border: 1px solid #259ad6;
    color: white;
}

button {
    width: 100%;
    padding: 10px;
    background: #259ad6;
    border: none;
    cursor: pointer;
}

.error {
    color: red;
    font-size: 12px;
}


.back {
    margin-top: 10px;
    background: transparent;
    border: 1px solid #259ad6;
    color: #259ad6;
}

@media (max-width: 768px) {
    .box {
        width: 90%;
        padding: 20px;
    }

    h3 {
        text-align: center;
    }
}
</style>

<div class="container">
    <div class="box">
        <h3>LOGIN</h3>

        <input placeholder="Email" bind:value={email} />
        <input type="password" placeholder="Password" bind:value={password} />

        <button on:click={handleLogin}>Login</button>

        <button class="back" on:click={() => navigate('lander')}>
            ← Back
        </button>

        {#if error}
            <div class="error">{error}</div>
        {/if}
    </div>
</div>